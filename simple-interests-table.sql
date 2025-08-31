-- Enable the auth extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the interests table with user_id for authentication
CREATE TABLE IF NOT EXISTS public.interests (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, user_id) -- Ensure unique interests per user
);

-- Insert some sample data (this will be for the first user who signs up)
-- Note: We'll need to update this after user authentication is set up

-- Enable Row Level Security (RLS)
ALTER TABLE public.interests ENABLE ROW LEVEL SECURITY;

-- Create policies for the interests table
-- Allow users to read only their own interests
CREATE POLICY "Users can view their own interests" ON public.interests
    FOR SELECT USING (auth.uid() = user_id);

-- Allow users to insert their own interests
CREATE POLICY "Users can insert their own interests" ON public.interests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own interests
CREATE POLICY "Users can update their own interests" ON public.interests
    FOR UPDATE USING (auth.uid() = user_id);

-- Allow users to delete their own interests
CREATE POLICY "Users can delete their own interests" ON public.interests
    FOR DELETE USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.interests TO authenticated;
GRANT USAGE ON SEQUENCE public.interests_id_seq TO authenticated; 

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

-- Function to get cached news with proper array comparison
CREATE OR REPLACE FUNCTION get_cached_news(
  p_user_id UUID,
  p_interests TEXT[],
  p_current_time TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
  id INTEGER,
  user_id UUID,
  interests TEXT[],
  articles JSONB,
  created_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cn.id,
    cn.user_id,
    cn.interests,
    cn.articles,
    cn.created_at,
    cn.expires_at
  FROM cached_news cn
  WHERE cn.user_id = p_user_id
    AND cn.interests = p_interests
    AND cn.expires_at > p_current_time
  LIMIT 1;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_cached_news(UUID, TEXT[], TIMESTAMP WITH TIME ZONE) TO authenticated;

-- Function to upsert cached news with proper array handling
CREATE OR REPLACE FUNCTION upsert_cached_news(
  p_user_id UUID,
  p_interests TEXT[],
  p_articles JSONB,
  p_expires_at TIMESTAMP WITH TIME ZONE
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO cached_news (user_id, interests, articles, expires_at)
  VALUES (p_user_id, p_interests, p_articles, p_expires_at)
  ON CONFLICT (user_id, interests)
  DO UPDATE SET
    articles = EXCLUDED.articles,
    expires_at = EXCLUDED.expires_at,
    created_at = NOW();
END;
$$;

-- Grant execute permission on the upsert function
GRANT EXECUTE ON FUNCTION upsert_cached_news(UUID, TEXT[], JSONB, TIMESTAMP WITH TIME ZONE) TO authenticated;

-- Function to delete cached news with proper array handling
CREATE OR REPLACE FUNCTION delete_cached_news(
  p_user_id UUID,
  p_interests TEXT[]
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM cached_news
  WHERE user_id = p_user_id
    AND interests = p_interests;
END;
$$;

-- Grant execute permission on the delete function
GRANT EXECUTE ON FUNCTION delete_cached_news(UUID, TEXT[]) TO authenticated; 