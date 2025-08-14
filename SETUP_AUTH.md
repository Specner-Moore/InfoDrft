# User Authentication Setup Guide

This guide will help you set up user authentication for your interests tracker application.

## Prerequisites

- A Supabase project with authentication enabled
- Your Supabase URL and anon key configured in environment variables

## Database Setup

1. **Run the updated SQL script** in your Supabase SQL editor:

```sql
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
```

2. **Configure Authentication Settings** in your Supabase dashboard:
   - Go to Authentication > Settings
   - Enable email confirmations (recommended for production)
   - Configure your site URL
   - Set up email templates if desired

## Environment Variables

Make sure you have these environment variables set in your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Features Added

### 1. User Authentication
- **Sign Up**: Users can create new accounts with email and password
- **Sign In**: Existing users can sign in with their credentials
- **Sign Out**: Users can sign out from their profile

### 2. User-Specific Interests
- Each user now has their own private list of interests
- Interests are automatically associated with the user who created them
- Users can only see, add, edit, and delete their own interests

### 3. Sample Data
- New users automatically get 10 sample interests when they sign up
- This provides a good starting point for new users

### 4. Security
- Row Level Security (RLS) ensures users can only access their own data
- All database operations are properly authenticated
- Session management is handled automatically

## How It Works

1. **Unauthenticated Users**: See a login/signup form
2. **New Users**: Can create an account and get sample interests
3. **Authenticated Users**: Can manage their personal interests list
4. **Session Persistence**: Users stay logged in across browser sessions

## Testing

1. Create a new account with an email and password
2. Check that you see the sample interests
3. Try adding, editing, and deleting interests
4. Sign out and sign back in to verify session persistence
5. Create a second account to verify data isolation

## Troubleshooting

### Common Issues:

1. **"Authentication Required" error**: Make sure RLS policies are correctly set up
2. **Can't sign up**: Check that email confirmations are properly configured
3. **Can't see interests**: Verify the user is authenticated and policies are working
4. **Database errors**: Ensure the SQL script was run successfully

### Debug Steps:

1. Check browser console for errors
2. Verify environment variables are set correctly
3. Test database policies in Supabase dashboard
4. Check authentication logs in Supabase dashboard

## Next Steps

Consider adding these features:
- Password reset functionality
- Social authentication (Google, GitHub, etc.)
- User profile management
- Interest categories or tags
- Sharing interests with other users 