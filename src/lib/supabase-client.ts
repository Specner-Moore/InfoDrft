import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Singleton instance for client-side Supabase client
let supabaseClient: SupabaseClient | null = null

// Client-side Supabase client (for use in client components)
export const createClientComponentClient = (): SupabaseClient => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    // Server-side rendering - return a mock client or throw a more specific error
    throw new Error('Supabase client cannot be created during server-side rendering')
  }
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Supabase environment variables are not configured')
  }
  
  // Return existing instance if it exists
  if (supabaseClient) {
    return supabaseClient
  }
  
  // Create new instance only if one doesn't exist
  supabaseClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL, 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  
  return supabaseClient
}

// Legacy client for backward compatibility
export const supabase = (): SupabaseClient => {
  return createClientComponentClient()
} 