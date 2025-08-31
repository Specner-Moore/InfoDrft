import { NextRequest } from 'next/server'
import { fetchNewsFromNewsAPI } from '@/lib/newsapi'
import { summarizeArticlesWithOpenAI } from '@/lib/openai'
import { NewsCacheServer } from '@/lib/news-cache-server'
import { validateEnv } from '@/lib/env'

// Force dynamic rendering since this route uses request.url
export const dynamic = 'force-dynamic'

// Increase timeout for streaming operations
export const maxDuration = 30

export async function GET() {
  try {
    // Debug logging to see what environment variables are available
    console.log('Debug - Environment variables check:')
    console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING')
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING')
    console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING')
    console.log('NEWS_API_KEY:', process.env.NEWS_API_KEY ? 'SET' : 'MISSING')
    console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'SET' : 'MISSING')
    
    // Validate environment variables
    const env = validateEnv()
    
    // Test basic environment configuration
    let supabaseStatus = 'unknown'
    try {
      if (env.supabase.url && env.supabase.serviceRoleKey) {
        supabaseStatus = 'configured'
      } else {
        supabaseStatus = 'missing'
      }
    } catch (error) {
      supabaseStatus = 'error'
      console.error('Supabase configuration check failed:', error)
    }

    return new Response(
      JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: {
          newsApi: env.newsapi.apiKey ? 'configured' : 'missing',
          openai: env.openai.apiKey ? 'configured' : 'missing',
          supabase: supabaseStatus
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Health check failed:', error)
    return new Response(
      JSON.stringify({
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder()
  
  try {
    const body = await request.json()
    const { interests, userId, forceRefresh = false } = body
    
    if (!interests || !Array.isArray(interests) || interests.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Valid interests array is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log('Received POST request for interests:', interests, 'forceRefresh:', forceRefresh)

    // Validate environment variables
    try {
      const env = validateEnv()
      if (!env.newsapi.apiKey || !env.openai.apiKey) {
        return new Response(
          JSON.stringify({ error: 'API keys not configured' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
      }
    } catch (envError) {
      console.error('Environment validation failed:', envError)
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Initialize cache with error handling
    let newsCache: NewsCacheServer
    try {
      newsCache = new NewsCacheServer()
    } catch (cacheError) {
      console.error('Failed to initialize cache:', cacheError)
      return new Response(
        JSON.stringify({ error: 'Cache initialization failed' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    // Check cache first (unless force refresh is requested)
    if (!forceRefresh) {
      try {
        console.log('🔍 Checking cache for user:', userId, 'forceRefresh:', forceRefresh)
        const cachedArticles = await newsCache.getCachedNews(userId, interests)
        if (cachedArticles && cachedArticles.length > 0) {
          console.log('✅ Returning cached articles:', cachedArticles.length)
          
          // Return cached articles immediately
          const stream = new ReadableStream({
            start(controller) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                type: 'cached',
                articles: cachedArticles
              })}\n\n`))
              
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                type: 'complete',
                totalArticles: cachedArticles.length,
                cached: true
              })}\n\n`))
              
              controller.close()
            }
          })

          return new Response(stream, {
            headers: {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive',
            },
          })
        }
      } catch (cacheError) {
        console.error('Cache check failed, continuing with fresh fetch:', cacheError)
        // Continue without cache if it fails
      }
    }

    // If force refresh or no cache, clear existing cache entry
    if (forceRefresh) {
      try {
        await newsCache.forceRefresh(userId, interests)
      } catch (refreshError) {
        console.error('Force refresh failed:', refreshError)
        // Continue anyway
      }
    }

    // Create a readable stream for new articles
    const stream = new ReadableStream({
      async start(controller) {
        let controllerClosed = false
        
        try {
          // Fetch articles
          const articles = await fetchNewsFromNewsAPI({ allInterests: interests })
          
          console.log(`Streaming: ${articles.length} articles individually`)

          // Process articles individually and stream them as they're ready
          let articlesSent = 0

          // Process articles in parallel but send them as they complete
          const processPromises = articles.map(async (article, index) => {
            try {
              const summarizedArticle = await summarizeArticlesWithOpenAI({ articles: [article] })
              
              if (!controllerClosed) {
                // Send individual article as it's processed
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                  type: 'article',
                  article: summarizedArticle[0],
                  index: index
                })}\n\n`))
                
                articlesSent++
                
                // If this is the first article, send a "first-article" signal
                if (articlesSent === 1) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                    type: 'first-article'
                  })}\n\n`))
                }
              }
              
              return summarizedArticle[0]
            } catch (articleError) {
              console.error('Error processing article:', article.title, articleError)
              // Return a fallback article
              return {
                ...article,
                summary: 'Unable to generate summary at this time. Please read the full article for details.',
                url: article.url
              }
            }
          })

          // Wait for all articles to be processed
          const results = await Promise.all(processPromises)
          
          if (!controllerClosed) {
            // Cache all articles
            try {
              console.log('💾 Caching all articles:', results.length)
              await newsCache.cacheNews(userId, interests, results)
            } catch (cacheError) {
              console.error('Failed to cache articles:', cacheError)
              // Continue without caching
            }

            // Send completion signal
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'complete',
              totalArticles: results.length,
              cached: false
            })}\n\n`))
          }

          if (!controllerClosed) {
            controller.close()
            controllerClosed = true
          }
        } catch (error) {
          console.error('Error in streaming:', error)
          if (!controllerClosed) {
            try {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                type: 'error',
                error: error instanceof Error ? error.message : 'Unknown error'
              })}\n\n`))
              controller.close()
            } catch (closeError) {
              console.error('Error closing controller:', closeError)
            }
            controllerClosed = true
          }
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Error in streaming API:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to start streaming' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
