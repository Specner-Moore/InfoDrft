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