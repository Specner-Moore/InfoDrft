'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { AuthForm } from './auth-form'
import { NewsPage } from './news-page'

export function SimpleAuthWrapper() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasInterests, setHasInterests] = useState(false)
  
  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => {
    let mounted = true

    const checkAuth = async () => {
      try {
        console.log('🔍 Starting simple auth check...')
        
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        console.log('📋 Session result:', { hasSession: !!session, error: !!error })
        
        if (mounted) {
          setUser(session?.user ?? null)
          
          if (session?.user) {
            console.log('👤 User found:', session.user.email)
            // For now, assume they have interests to avoid the complex check
            setHasInterests(true)
          } else {
            console.log('👤 No user found')
            setHasInterests(false)
          }
          
          setLoading(false)
          console.log('✅ Simple auth check complete')
        }
      } catch (error) {
        console.error('❌ Auth check failed:', error)
        if (mounted) {
          setUser(null)
          setHasInterests(false)
          setLoading(false)
        }
      }
    }

    checkAuth()

    // Set up auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔄 Auth state change:', event, session?.user?.email)
        
        if (mounted) {
          setUser(session?.user ?? null)
          
          if (session?.user) {
            // Assume they have interests for now
            setHasInterests(true)
          } else {
            setHasInterests(false)
          }
          
          setLoading(false)
        }
      }
    )

    return () => {
      console.log('🧹 Cleaning up auth effect')
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase])

  // Handle redirect to setup page for new users
  useEffect(() => {
    console.log('🔄 Redirect effect triggered:', { user: !!user, hasInterests, loading })
    if (user && !hasInterests && !loading) {
      console.log('🚀 Redirecting new user to setup...')
      router.push('/setup')
    }
  }, [user, hasInterests, loading, router])

  // Show loading
  if (loading) {
    console.log('🎨 Rendering loading screen')
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  // Show sign-in page if no user
  if (!user) {
    console.log('🎨 Rendering sign-in page')
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Interests Tracker
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Sign in to manage your personal interests
            </p>
          </div>
          <AuthForm onAuthSuccess={() => {}} />
        </div>
      </div>
    )
  }

  // Show main app if user is signed in and has interests
  console.log('🎨 Rendering main app')
  return (
    <div className="flex min-h-screen flex-col p-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Personalized News
          </h1>
        </div>

        {/* Main Content - Show News Component */}
        <NewsPage />
      </div>
    </div>
  )
} 