interface NewsRequest {
  allInterests: string[]
}

interface NewsArticle {
  title: string
  description: string
  category: string
  url: string
}

//format of each article from the NewsAPI
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

//format of the response from the NewsAPI
interface NewsAPIResponse {
  status: string
  totalResults: number
  articles: NewsAPIArticle[]
}

//fetch news based on interests
export async function fetchNewsFromNewsAPI({ allInterests }: NewsRequest): Promise<NewsArticle[]> {
  if (!process.env.NEWS_API_KEY) {
    throw new Error('NewsAPI key is not configured')
  }

  // Validate interests
  if (!allInterests || allInterests.length === 0) {
    throw new Error('No interests provided for news search')
  }

  // Filter out empty or invalid interests
  const validInterests = allInterests.filter(interest => 
    interest && typeof interest === 'string' && interest.trim().length > 0
  )

  if (validInterests.length === 0) {
    throw new Error('No valid interests found. Please add some interests first.')
  }

  console.log('Searching for news with interests:', validInterests)

  // Create OR query with all interests to search in description
  const orQuery = validInterests.map(interest => `"${interest}"`).join(' OR ')
  console.log(`Searching for articles with OR query in description: ${orQuery}`)
  
     // Try multiple strategies to find articles
   const strategies = [
           // Strategy 1: For multiple interests, use searchIn=description; for single interests, use searchIn=description with pageSize=25
      async () => {
        //get random date from last 7 days for variety
        const daysBack = Math.floor(Math.random() * 7) + 1
        const dateFrom = new Date()
        dateFrom.setDate(dateFrom.getDate() - daysBack)
        const fromDate = dateFrom.toISOString().split('T')[0]
        
        //get random sort option for variety
        const sortOptions = ['popularity', 'relevancy']
        const sortBy = sortOptions[Math.floor(Math.random() * sortOptions.length)]
        
        // For single interests, always use page 1; for multiple interests, try pages 1-3
         const page = validInterests.length === 1 ? 1 : Math.floor(Math.random() * 3) + 1
        
        // For single interests, use pageSize=15; for multiple interests, use pageSize=20
        const pageSize = validInterests.length === 1 ? 15 : 20
        
        // Always use searchIn=description and exclude unwanted sources
        const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(orQuery)}&searchIn=description&from=${fromDate}&sortBy=${sortBy}&page=${page}&pageSize=${pageSize}&language=en&excludeDomains=rlsbb.cc&apiKey=${process.env.NEWS_API_KEY}`
        
        //log the request parameters
        console.log(`Strategy 1: Making request with OR query...`)
        console.log(`Parameters: from=${fromDate}, sortBy=${sortBy}, page=${page}, pageSize=${pageSize}, searchIn=description`)
        console.log(`Query: ${orQuery}`)

        const response = await fetch(url)
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error(`NewsAPI Error Response:`, errorText)
          console.error(`Response status: ${response.status}`)
          throw new Error(`NewsAPI request failed: ${response.status} - ${errorText}`)
        }

        const data = await response.json() as NewsAPIResponse
        
        if (data.status !== 'ok') {
          throw new Error(`NewsAPI returned status: ${data.status}`)
        }
        
        if (data.articles && data.articles.length > 0) {
          const articles: NewsArticle[] = data.articles
            .map((article: NewsAPIArticle) => ({
              title: article.title || 'No title available',
              description: article.description || article.content?.substring(0, 200) + '...' || 'No description available',
              category: article.source.name || 'General',
              url: article.url || '#'
            }))

          if (articles.length === 0) {
            throw new Error('No English articles found after filtering')
          }

          const shuffledArticles = articles.sort(() => Math.random() - 0.5)
          const selectedArticles = shuffledArticles.slice(0, 10)

          console.log(`✅ Strategy 1 successful! Found ${articles.length} articles, selected ${selectedArticles.length}`)
          return selectedArticles
        }
        throw new Error('No articles found')
      },

      // Strategy 2: For single interests, try without searchIn=description as fallback
      async () => {
        if (validInterests.length === 1) {
          const interest = validInterests[0]
          //get random date from last 7 days for variety
          const daysBack = Math.floor(Math.random() * 7) + 1
          const dateFrom = new Date()
          dateFrom.setDate(dateFrom.getDate() - daysBack)
          const fromDate = dateFrom.toISOString().split('T')[0]
          

          //get random sort option for variety
          const sortOptions = ['popularity', 'relevancy']
          const sortBy = sortOptions[Math.floor(Math.random() * sortOptions.length)]
          
          const page = 1
          const pageSize = 20
          
          const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(interest)}&from=${fromDate}&sortBy=${sortBy}&page=${page}&pageSize=${pageSize}&language=en&excludeDomains=rlsbb.cc&apiKey=${process.env.NEWS_API_KEY}`
          
          //log the request parameters
          console.log(`Strategy 2: Trying broader search for single interest "${interest}" without searchIn=description...`)

          const response = await fetch(url)
          
          if (!response.ok) {
            throw new Error(`NewsAPI request failed: ${response.status}`)
          }

          const data = await response.json() as NewsAPIResponse
          
          if (data.status === 'ok' && data.articles && data.articles.length > 0) {
            const articles: NewsArticle[] = data.articles
              .map((article: NewsAPIArticle) => ({
                title: article.title || 'No title available',
                description: article.description || article.content?.substring(0, 200) + '...' || 'No description available',
                category: article.source.name || 'General',
                url: article.url || '#'
              }))

            if (articles.length === 0) {
              throw new Error('No English articles found after filtering')
            }

            const shuffledArticles = articles.sort(() => Math.random() - 0.5)
            const selectedArticles = shuffledArticles.slice(0, 10)

            console.log(`✅ Strategy 2 successful! Found ${articles.length} articles, selected ${selectedArticles.length}`)
            return selectedArticles
          }
        }
        throw new Error('No articles found')
      }
   ]

  // Try each strategy until one works
  for (let i = 0; i < strategies.length; i++) {
    try {
      console.log(`Trying strategy ${i + 1}...`)
      const articles = await strategies[i]()
      return articles
    } catch (error) {
      console.log(`❌ Strategy ${i + 1} failed:`, error instanceof Error ? error.message : error)
      if (i === strategies.length - 1) {
        console.error(`All strategies failed for interests:`, validInterests)
      }
    }
  }

  // Fallback: try a general search if no specific interest articles found
  console.log('No specific interest articles found, trying general news...')
  try {
    const daysBack = Math.floor(Math.random() * 7) + 1
    const dateFrom = new Date()
    dateFrom.setDate(dateFrom.getDate() - daysBack)
    const fromDate = dateFrom.toISOString().split('T')[0]
    
    const url = `https://newsapi.org/v2/everything?q=news&from=${fromDate}&sortBy=popularity&page=1&pageSize=10&language=en&apiKey=${process.env.NEWS_API_KEY}`
    
    const response = await fetch(url)
    const data = await response.json() as NewsAPIResponse
    
    if (data.status === 'ok' && data.articles && data.articles.length > 0) {
      const articles: NewsArticle[] = data.articles.map((article: NewsAPIArticle) => ({
        title: article.title || 'No title available',
        description: article.description || article.content?.substring(0, 200) + '...' || 'No description available',
        category: article.source.name || 'General',
        url: article.url || '#'
      }))
      
      console.log(`✅ Fallback successful! Fetched ${articles.length} general news articles`)
      return articles
    }
  } catch (error) {
    console.error('❌ Fallback search failed:', error)
  }

  // If all strategies fail, throw error
  throw new Error('Unable to find news articles. Please try again later or add more diverse interests.')
} 