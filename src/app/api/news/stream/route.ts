import { NextRequest } from 'next/server'
import { fetchNewsFromNewsAPI } from '@/lib/newsapi'
import { summarizeArticlesWithOpenAI } from '@/lib/openai'

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder()
  
  try {
    const { searchParams } = new URL(request.url)
    const interestsParam = searchParams.get('interests')
    
    if (!interestsParam) {
      return new Response(
        JSON.stringify({ error: 'Interests parameter is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const interests = JSON.parse(interestsParam)
    console.log('Received streaming request for interests:', interests)

    // Validate input
    if (!Array.isArray(interests) || interests.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid interests provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Check API keys
    if (!process.env.NEWS_API_KEY || !process.env.OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'API keys not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Create a readable stream
    const stream = new ReadableStream({
      async start(controller) {
        let controllerClosed = false
        
        try {
          // Fetch articles
          const articles = await fetchNewsFromNewsAPI({ allInterests: interests })
          
          // Split into batches
          const firstBatch = articles.slice(0, 5)
          const secondBatch = articles.slice(5, 10)

          console.log(`Streaming: ${firstBatch.length} articles in first batch, ${secondBatch.length} in second batch`)

          // Send first batch immediately
          try {
            const firstBatchSummarized = await summarizeArticlesWithOpenAI({ articles: firstBatch })
            
            if (!controllerClosed) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                type: 'first-batch',
                articles: firstBatchSummarized
              })}\n\n`))
            }
          } catch (batchError) {
            console.error('Error processing first batch:', batchError)
            if (!controllerClosed) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                type: 'error',
                error: 'Failed to process first batch of articles'
              })}\n\n`))
            }
            throw batchError
          }

          // Process second batch
          try {
            const secondBatchSummarized = await summarizeArticlesWithOpenAI({ articles: secondBatch })
            
            if (!controllerClosed) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                type: 'second-batch',
                articles: secondBatchSummarized
              })}\n\n`))

              // Send completion signal
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                type: 'complete',
                totalArticles: firstBatch.length + secondBatch.length
              })}\n\n`))
            }
          } catch (batchError) {
            console.error('Error processing second batch:', batchError)
            if (!controllerClosed) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                type: 'error',
                error: 'Failed to process second batch of articles'
              })}\n\n`))
            }
            throw batchError
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
