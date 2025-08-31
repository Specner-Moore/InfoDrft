'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/lib/supabase-client'

// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic'

interface NewsArticle {
  title: string
  description: string
  category: string
  summary: string
  url: string
}

interface Interest {
  id: number
  name: string
}

export default function NewsPage() {
  const [availableInterests, setAvailableInterests] = useState<Interest[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isCached, setIsCached] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)

  const supabase = createClientComponentClient()

  // Fetch interests from database on component mount and generate news automatically
  useEffect(() => {
    let isMounted = true
    
    async function fetchInterests() {
      try {
        // First get the current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          if (!isMounted) return
          setError('Please sign in to view personalized news')
          setIsInitializing(false)
          return
        }

        // Then fetch interests for the current user only
        const { data: interests, error } = await supabase
          .from('interests')
          .select('id, name')
          .eq('user_id', user.id)
          .order('name', { ascending: true })

        if (!isMounted) return

        if (error) {
          console.error('Error fetching interests:', error)
          setError('Failed to load interests from database')
          setIsInitializing(false)
        } else {
          setAvailableInterests(interests || [])
          // Automatically generate news if interests are available
          if (interests && interests.length > 0) {
            generateNews(interests.map(interest => interest.name), user.id, false)
          } else {
            // Redirect to setup if no interests found
            window.location.href = '/setup'
          }
          setIsInitializing(false)
        }
      } catch (err) {
        if (!isMounted) return
        console.error('Error fetching interests:', err)
        setError('Failed to load interests from database')
        setIsInitializing(false)
      }
    }

    fetchInterests()
    
    return () => {
      isMounted = false
    }
  }, [supabase]) // Add supabase to dependency array

  const generateNews = async (interests: string[], userId: string, forceRefresh: boolean = false) => {
    
    if (interests.length === 0) {
      setError('No interests available to generate news')
      return
    }

    setIsLoading(true)
    setError(null)
    setArticles([]) // Clear previous articles
    setIsCached(false)
    
    try {
      const response = await fetch('/api/news/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          interests: interests,
          userId: userId,
          forceRefresh: forceRefresh
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch news')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('Failed to create response reader')
      }

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              
              if (data.type === 'cached') {
                setArticles(data.articles)
                setIsCached(true)
                setIsLoading(false)
                return // Exit early for cached articles
              } else if (data.type === 'first-article') {
                setIsLoadingMore(true) // Show loading for remaining articles
                // Scroll to top after first article
                window.scrollTo({ top: 0, behavior: 'smooth' })
              } else if (data.type === 'article') {
                setArticles(prev => {
                  const newArticles = [...prev, data.article]
                  // Hide loading after first few articles
                  if (newArticles.length >= 3) {
                    setIsLoadingMore(false)
                  }
                  return newArticles
                })
              } else if (data.type === 'complete') {
                setIsLoadingMore(false)
                setIsCached(data.cached || false)
              } else if (data.type === 'error') {
                throw new Error(data.error)
              }
            } catch (parseError) {
              console.error('Error parsing stream data:', parseError)
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      setArticles([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleGetMoreNews = async (interests: string[]) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      generateNews(interests, user.id, true) // Force refresh
    }
  }

  // Show loading screen while checking interests
  if (isInitializing) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-8">
        <div className="max-w-4xl mx-auto w-full">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 border border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Checking your interests...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-4xl mx-auto w-full">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 border border-gray-200 dark:border-gray-700">
                     {/* Error Display */}
           {error && (
             <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
               <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                 Unable to Generate News
               </h3>
               <p className="text-red-600 dark:text-red-300 mb-3">
                 {error.includes('NewsAPI key') 
                   ? 'NewsAPI key is not configured. Please check your environment settings.'
                   : error.includes('OpenAI API key')
                   ? 'OpenAI API key is not configured. Please check your environment settings.'
                   : error.includes('401 Unauthorized')
                   ? 'API key is invalid or expired. Please check your API keys in the environment settings.'
                   : error.includes('Failed to fetch')
                   ? 'Unable to connect to the news service. Please try again later.'
                                 : error.includes('No interests available')
              ? 'No interests found. Please add some interests on the interests page first.'
                   : error
                 }
               </p>
               {(error.includes('NewsAPI') || error.includes('OpenAI')) && (
                 <div className="text-sm text-red-500 dark:text-red-400">
                   <p className="font-medium">To fix this:</p>
                   <ul className="list-disc list-inside mt-1 space-y-1">
                     {error.includes('NewsAPI') && (
                       <>
                         <li>Get your NewsAPI key from <a href="https://newsapi.org" target="_blank" rel="noopener noreferrer" className="underline hover:text-red-700">NewsAPI.org</a></li>
                         <li>Add it to your .env.local file as NEWS_API_KEY=your_key_here</li>
                       </>
                     )}
                     {error.includes('OpenAI') && (
                       <>
                         <li>Get your OpenAI API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline hover:text-red-700">OpenAI Platform</a></li>
                         <li>Add it to your .env.local file as OPENAI_API_KEY=your_key_here</li>
                       </>
                     )}
                     <li>Restart the development server</li>
                   </ul>
                 </div>
               )}
             </div>
           )}

                     {/* News Results Section */}
           <div>
             <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
               News Based on Your Interests
             </h2>
             
             {/* Cache Status Indicator */}
             {isCached && (
               <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                 <p className="text-sm text-blue-700 dark:text-blue-300">
                   📋 Showing cached articles from today. Click "Get More Articles" below to refresh.
                 </p>
               </div>
             )}
            
            {isLoading ? (
              <div className="space-y-6">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg animate-pulse">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-3"></div>
                    <div className="flex items-center justify-between">
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : articles.length > 0 ? (
              <div className="space-y-6">
                {articles.map((article, index) => (
                  <button
                    key={index}
                    onClick={() => window.open(article.url, '_blank', 'noopener,noreferrer')}
                    className="w-full text-left p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer group"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {article.title}
                    </h3>
                    <div className="mb-3">
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border-l-4 border-blue-500 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors">
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1 flex items-center justify-between">
                          <span>AI Summary:</span>
                          <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                            Click to read full article →
                          </span>
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          {article.summary}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                        <span>{article.category}</span>
                      </div>
                    </div>
                  </button>
                ))}
                
                {/* Loading indicator for second batch */}
                {isLoadingMore && (
                  <div className="text-center py-4">
                    <div className="inline-flex items-center px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      <span className="text-sm font-medium">Loading more articles...</span>
                    </div>
                  </div>
                )}
              </div>
                         ) : (
                                <div className="text-center py-8">
                   <p className="text-gray-600 dark:text-gray-400">
                     Loading news based on your interests...
                   </p>
                 </div>
             )}
          </div>

          {/* Get More Articles Section */}
          {availableInterests.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 text-center">
                Get More Articles
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6 text-center">
                Click on an interest below to get fresh articles focused on that topic, or choose "All Interests" for a broader selection. This will refresh the cache with new articles.
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
                {/* All Interests Button */}
                <button
                  onClick={() => handleGetMoreNews(availableInterests.map(interest => interest.name))}
                  disabled={isLoading}
                  className="p-4 rounded-lg border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {isLoading ? 'Loading...' : 'All Interests'}
                </button>
                
                {/* Individual Interest Buttons */}
                {availableInterests.map((interest) => (
                  <button
                    key={interest.id}
                    onClick={() => handleGetMoreNews([interest.name])}
                    disabled={isLoading}
                    className="p-4 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {isLoading ? 'Loading...' : interest.name}
                  </button>
                ))}
              </div>
              
              {isLoading && (
                <div className="text-center">
                  <p className="text-gray-600 dark:text-gray-400">
                    Fetching new articles...
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 