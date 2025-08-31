import { NextRequest } from 'next/server'

export async function GET() {
  try {
    // Simple environment variable check
    const envVars = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING',
      NEWS_API_KEY: process.env.NEWS_API_KEY ? 'SET' : 'MISSING',
      OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'SET' : 'MISSING',
    }

    // Get all environment variable keys that contain 'SUPABASE'
    const supabaseKeys = Object.keys(process.env).filter(key => key.includes('SUPABASE'))

    return new Response(
      JSON.stringify({
        status: 'success',
        timestamp: new Date().toISOString(),
        environmentVariables: envVars,
        supabaseKeys: supabaseKeys,
        supabaseServiceRoleLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
