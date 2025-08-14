interface NewsRequest {
  allInterests: string[]
}

interface NewsArticle {
  title: string
  description: string
  category: string
}

interface NewsAPIArticle {
  source: {
    id: string | null
    name: string
  }
  author: string | null
  title: string
  description: string | null
  url: string
  urlToImage: string | null
  publishedAt: string
  content: string | null
}

interface NewsAPIResponse {
  status: string
  totalResults: number
  articles: NewsAPIArticle[]
}

export async function fetchNewsFromNewsAPI({ allInterests }: NewsRequest): Promise<NewsArticle[]> {
  if (!process.env.NEWS_API_KEY) {
    throw new Error('NewsAPI key is not configured')
  }

  try {
    // Create a query based on the interests
    const query = allInterests.join(' OR ')
    
    console.log('Making request to NewsAPI.org...')
    
    // Calculate date for last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const fromDate = sevenDaysAgo.toISOString().split('T')[0]
    
    const response = await fetch(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&from=${fromDate}&sortBy=relevancy&pageSize=5&language=en&apiKey=${process.env.NEWS_API_KEY}`
    )
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('NewsAPI Error Response:', errorText)
      throw new Error(`NewsAPI error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const data = await response.json() as NewsAPIResponse
    
    if (data.status !== 'ok') {
      throw new Error(`NewsAPI returned status: ${data.status}`)
    }
    
    // Transform the NewsAPI response to match our expected format
    const articles: NewsArticle[] = data.articles.map((article: NewsAPIArticle) => ({
      title: article.title || 'No title available',
      description: article.description || article.content?.substring(0, 200) + '...' || 'No description available',
      category: article.source.name || 'General'
    }))

    // Validate that we have at least some articles
    if (articles.length === 0) {
      throw new Error('No recent news events found for the given interests. Try again later or add more diverse interests.')
    }

    return articles
  } catch (error) {
    console.error('Error fetching news from NewsAPI:', error)
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch news')
  }
} 