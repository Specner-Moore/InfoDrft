interface SummarizeRequest {
  articles: {
    title: string
    description: string
    category: string
    url: string
  }[]
}

//format of the summarized article
interface SummarizedArticle {
  title: string
  description: string
  category: string
  summary: string
  url: string
}

//pass articles to OpenAI to summarize
export async function summarizeArticlesWithOpenAI({ articles }: SummarizeRequest): Promise<SummarizedArticle[]> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured')
  }

  try {
    console.log('Summarizing articles with OpenAI...')
    
    const summarizedArticles: SummarizedArticle[] = []
    
    // Process each article individually to get better summaries
    for (const article of articles) {
      try {
        // Validate article data
        if (!article.title || !article.description) {
          console.warn('Skipping article with missing data:', article.title || 'No title')
          summarizedArticles.push({
            ...article,
            summary: 'Article summary not available due to missing data.',
            url: article.url
          })
          continue
        }

        //prompt for OpenAI to summarize the article
        const prompt = `
          Please provide a concise, engaging summary of the following news article. 
          The summary should be 5-10 sentences that capture the key points and main story.
          Focus on the most important information and make it easy to understand.
          
          Article Title: ${article.title}
          Article Description: ${article.description}
          Category: ${article.category}
          
          Summary:
        `

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
              {
                role: 'system',
                content: 'You are a helpful assistant that creates concise, engaging summaries of news articles. Provide clear, informative summaries.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            max_tokens: 150,
            temperature: 0.7,
          }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error('OpenAI API Error Response for article:', article.title, errorText)
          throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        const summary = data.choices[0]?.message?.content?.trim() || 'Summary not available'

        // Validate summary is not an error message
        if (summary.toLowerCase().includes('apologies') || summary.toLowerCase().includes('couldn\'t find')) {
          throw new Error('OpenAI returned an error message instead of summary')
        }

        // Check if summary is too short or empty
        if (!summary || summary.length < 10) {
          console.warn('Summary too short or empty for article:', article.title)
          throw new Error('Summary too short or empty')
        }

        summarizedArticles.push({
          ...article,
          summary,
          url: article.url
        })
      } catch (articleError) {
        console.error('Error summarizing article:', article.title, articleError)
        // Add article with fallback summary instead of failing completely
        summarizedArticles.push({
          ...article,
          summary: 'Unable to generate summary at this time. Please read the full article for details.',
          url: article.url
        })
      }
    }

    return summarizedArticles
  } catch (error) {
    console.error('Error summarizing articles with OpenAI:', error)
    throw new Error(error instanceof Error ? error.message : 'Failed to summarize articles')
  }
} 