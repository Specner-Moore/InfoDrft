import { createClientComponentClient } from './supabase-client'

export interface CachedNewsArticle {
  title: string
  description: string
  category: string
  summary: string
  url: string
}

export interface NewsCacheEntry {
  id: number
  user_id: string
  interests: string[]
  articles: CachedNewsArticle[]
  created_at: string
  expires_at: string
}

export class NewsCache {
  private supabase = createClientComponentClient()

  // Get the next midnight timestamp for cache expiration
  private getNextMidnight(): Date {
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    return tomorrow
  }

  // Check if cached news exists and is still valid
  async getCachedNews(userId: string, interests: string[]): Promise<CachedNewsArticle[] | null> {
    try {
      // Sort interests to ensure consistent cache key
      const sortedInterests = [...interests].sort()
      
      console.log('🔍 Checking cache for user:', userId, 'interests:', sortedInterests)
      
      // Use raw SQL for array comparison since Supabase client doesn't handle arrays well
      const { data, error } = await this.supabase
        .rpc('get_cached_news', {
          p_user_id: userId,
          p_interests: sortedInterests,
          p_current_time: new Date().toISOString()
        })

      if (error) {
        console.log('❌ Cache lookup error:', error)
        return null
      }

      if (!data) {
        console.log('📭 No cached data found')
        return null
      }

      console.log('✅ Found cached articles:', data.articles?.length || 0)
      return data.articles
    } catch (error) {
      console.error('❌ Error fetching cached news:', error)
      return null
    }
  }

  // Store news articles in cache
  async cacheNews(userId: string, interests: string[], articles: CachedNewsArticle[]): Promise<void> {
    try {
      // Sort interests to ensure consistent cache key
      const sortedInterests = [...interests].sort()
      const expiresAt = this.getNextMidnight()

      console.log('💾 Caching articles for user:', userId, 'interests:', sortedInterests)
      console.log('📅 Expires at:', expiresAt.toISOString())
      console.log('📄 Articles to cache:', articles.length)

      // Use raw SQL for array insertion since Supabase client doesn't handle arrays well
      const { error } = await this.supabase
        .rpc('upsert_cached_news', {
          p_user_id: userId,
          p_interests: sortedInterests,
          p_articles: articles,
          p_expires_at: expiresAt.toISOString()
        })

      if (error) {
        console.error('❌ Error caching news:', error)
      } else {
        console.log('✅ Successfully cached articles')
      }
    } catch (error) {
      console.error('❌ Error caching news:', error)
    }
  }

  // Clear expired cache entries
  async clearExpiredCache(): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('cached_news')
        .delete()
        .lt('expires_at', new Date().toISOString())

      if (error) {
        console.error('Error clearing expired cache:', error)
      }
    } catch (error) {
      console.error('Error clearing expired cache:', error)
    }
  }

  // Force refresh cache by deleting existing entry
  async forceRefresh(userId: string, interests: string[]): Promise<void> {
    try {
      const sortedInterests = [...interests].sort()
      
      // Use raw SQL for array deletion
      const { error } = await this.supabase
        .rpc('delete_cached_news', {
          p_user_id: userId,
          p_interests: sortedInterests
        })

      if (error) {
        console.error('Error forcing cache refresh:', error)
      }
    } catch (error) {
      console.error('Error forcing cache refresh:', error)
    }
  }
}
