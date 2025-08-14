import { NextResponse } from 'next/server'

export async function POST() {
  // Temporarily disabled - use /api/news/stream instead
  return NextResponse.json(
    { error: 'This endpoint is disabled. Please use /api/news/stream for streaming news.' },
    { status: 410 }
  )
} 