import { NextResponse } from 'next/server'
import { validateEnv } from '@/lib/env'

export async function GET() {
  try {
    console.log('=== TEST ENV DEBUG ===')
    console.log('About to call validateEnv()')
    
    const env = validateEnv()
    
    console.log('validateEnv() succeeded')
    console.log('Environment variables status:')
    console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING')
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING')
    console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING')
    console.log('NEWS_API_KEY:', process.env.NEWS_API_KEY ? 'SET' : 'MISSING')
    console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'SET' : 'MISSING')
    
    return NextResponse.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      environment: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING',
        supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
        supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING',
        newsApiKey: process.env.NEWS_API_KEY ? 'SET' : 'MISSING',
        openaiApiKey: process.env.OPENAI_API_KEY ? 'SET' : 'MISSING',
        supabaseServiceRoleLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0
      },
      validateEnvResult: {
        supabase: {
          url: env.supabase.url ? 'SET' : 'MISSING',
          anonKey: env.supabase.anonKey ? 'SET' : 'MISSING',
          serviceRoleKey: env.supabase.serviceRoleKey ? 'SET' : 'MISSING'
        },
        newsapi: {
          apiKey: env.newsapi.apiKey ? 'SET' : 'MISSING'
        },
        openai: {
          apiKey: env.openai.apiKey ? 'SET' : 'MISSING'
        }
      }
    })
  } catch (error) {
    console.error('Test env failed:', error)
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
