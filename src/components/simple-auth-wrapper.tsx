'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { AuthForm } from './auth-form'
import NewsPage from '@/app/news/page'
import { InterestsProvider, useInterests } from './interests-context'

function AuthenticatedApp() {
  const { interests, loading: interestsLoading } = useInterests()
  const router = useRouter()

  // Handle redirect to setup page for new users
  useEffect(() => {
    if (!interestsLoading && interests.length === 0) {
      console.log('Redirecting new user to setup...')
      router.push('/setup')
    }
  }, [interests, interestsLoading, router])

  // Show loading while checking interests
  if (interestsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your interests...</p>
        </div>
      </div>
    )
  }

  // Show main app if user has interests
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

export function SimpleAuthWrapper() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [authTimeout, setAuthTimeout] = useState(false)
  
  const supabase = createClientComponentClient()

  useEffect(() => {
    let mounted = true

    const checkAuth = async () => {
      try {
        console.log('Starting simple auth check...')
        
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        console.log('Session result:', { hasSession: !!session, error: !!error })
        
        if (mounted) {
          setUser(session?.user ?? null)
          setLoading(false)
          console.log('Simple auth check complete')
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        if (mounted) {
          setUser(null)
          setLoading(false)
        }
      }
    }

    checkAuth()

    // Set up auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state change:', event, session?.user?.email)
        
        if (mounted) {
          setUser(session?.user ?? null)
          setLoading(false)
        }
      }
    )

    return () => {
      console.log('Cleaning up auth effect')
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase])

  // Set timeout for auth check
  useEffect(() => {
    const timer = setTimeout(() => {
      setAuthTimeout(true)
    }, 5000)

    return () => clearTimeout(timer)
  }, [])

  // Show loading
  if (loading && !authTimeout) {
    console.log('Rendering loading screen')
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
    console.log('Rendering sign-in page')
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

  // Show authenticated app with interests provider
  console.log('Rendering authenticated app')
  return (
    <InterestsProvider>
      <AuthenticatedApp />
    </InterestsProvider>
  )
} 