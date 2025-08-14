import { NextRequest, NextResponse } from 'next/server'
import { fetchNewsFromNewsAPI } from '@/lib/newsapi'
import { summarizeArticlesWithOpenAI } from '@/lib/openai'

export async function POST(request: NextRequest) {
  // Temporarily disabled - use /api/news/stream instead
  return NextResponse.json(
    { error: 'This endpoint is disabled. Please use /api/news/stream for streaming news.' },
    { status: 410 }
  )
} 