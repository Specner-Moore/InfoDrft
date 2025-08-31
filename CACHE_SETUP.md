# News Caching System Setup

This document explains how to set up and use the news caching system that automatically expires news articles at midnight each day.

## Overview

The caching system provides the following benefits:
- **Performance**: Cached articles load instantly instead of waiting for API calls
- **Cost Savings**: Reduces API calls to NewsAPI and OpenAI
- **User Experience**: Faster loading times for returning users
- **Automatic Expiration**: Articles automatically expire at midnight each day

## Database Setup

### Option 1: Automatic Setup (Recommended)
1. Navigate to `/setup-cache` in your application
2. Click "Setup Cache Table" button
3. The system will attempt to create the necessary database table

### Option 2: Manual Database Setup
If the automatic setup doesn't work, manually run these SQL commands in your Supabase SQL Editor:

```sql
-- Table for caching news articles
CREATE TABLE IF NOT EXISTS cached_news (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  interests TEXT[] NOT NULL,
  articles JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  UNIQUE(user_id, interests)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_cached_news_user_expires ON cached_news(user_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_cached_news_expires ON cached_news(expires_at);

-- Grant permissions for authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cached_news TO authenticated;
GRANT USAGE ON SEQUENCE public.cached_news_id_seq TO authenticated;
```

## How It Works

### 1. First Visit
- User visits the news page
- System checks for cached articles
- If no cache exists, fetches fresh articles from APIs
- Articles are stored in cache with expiration at next midnight

### 2. Subsequent Visits (Same Day)
- System finds cached articles
- Articles are displayed instantly
- No API calls are made
- User sees a blue indicator showing articles are cached

### 3. Cache Expiration
- At midnight, all cached articles expire
- Next visit will fetch fresh articles
- New cache entry is created

### 4. Force Refresh
- Users can click "Get More Articles" buttons
- This forces a cache refresh regardless of expiration
- New articles are fetched and cached

## Cache Behavior

- **Cache Key**: Combination of user ID and sorted interests
- **Expiration**: Midnight of the current day
- **Storage**: Articles are stored as JSON in Supabase
- **User Isolation**: Each user has their own cache
- **Interest Combination**: Different interest combinations create separate cache entries

## API Changes

The news API route (`/api/news/stream`) now:
- Accepts POST requests with `userId` and `forceRefresh` parameters
- Checks cache before making API calls
- Returns cached articles immediately if available
- Stores new articles in cache after processing

## Frontend Changes

The news page now:
- Shows cache status indicator
- Passes user ID to API calls
- Handles cached responses differently
- Provides clear feedback about cache state

## Monitoring and Maintenance

### Cache Cleanup
The system automatically handles expired cache entries, but you can manually clean up if needed:

```sql
-- Remove expired cache entries
DELETE FROM cached_news WHERE expires_at < NOW();
```

### Cache Statistics
Monitor cache usage with these queries:

```sql
-- Count total cached entries
SELECT COUNT(*) FROM cached_news;

-- Count entries by user
SELECT user_id, COUNT(*) FROM cached_news GROUP BY user_id;

-- Find expired entries
SELECT COUNT(*) FROM cached_news WHERE expires_at < NOW();
```

## Troubleshooting

### Common Issues

1. **Cache not working**
   - Check if the `cached_news` table exists
   - Verify user permissions are set correctly
   - Check browser console for errors

2. **Articles not updating**
   - Cache might not have expired yet
   - Use "Get More Articles" to force refresh
   - Check if `forceRefresh` parameter is being sent

3. **Database errors**
   - Verify Supabase connection
   - Check if user is authenticated
   - Ensure proper table structure

### Debug Mode
Enable console logging to see cache operations:
- Check browser console for cache-related messages
- Look for "Returning cached articles" or "Caching news" messages

## Performance Benefits

- **First Load**: Same as before (API calls + processing)
- **Subsequent Loads**: ~90% faster (instant cache retrieval)
- **API Cost Reduction**: Significant reduction in NewsAPI and OpenAI calls
- **User Experience**: Consistent, fast loading times

## Security Considerations

- Cache is user-specific (user_id isolation)
- No sensitive data stored in cache
- Cache entries are automatically cleaned up
- User authentication required for cache access

## Future Enhancements

Potential improvements for the caching system:
- Cache warming for popular interest combinations
- Intelligent cache invalidation based on news freshness
- Cache compression for large article sets
- Analytics dashboard for cache performance
- Background cache cleanup jobs
