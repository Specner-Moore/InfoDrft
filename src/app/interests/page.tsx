'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'
import { InterestsTable } from '@/components/interests-table'
import { AddInterestForm } from '@/components/add-interest-form'

export default function InterestsPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)
  
  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => {
    let mounted = true

    const checkAuth = async () => {
      try {
        console.log('Checking authentication...')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (mounted) {
          if (error) {
            console.error('Session error:', error)
            setUser(null)
          } else {
            console.log('Session result:', session ? 'Found' : 'None')
            setUser(session?.user ?? null)
            
            // Check if user has interests - if not, redirect to setup
            if (session?.user) {
              const { data: interests, error: interestsError } = await supabase
                .from('interests')
                .select('id')
                .eq('user_id', session.user.id)
                .limit(1)
              
              if (!interestsError && interests && interests.length === 0) {
                router.push('/setup')
                return
              }
            }
          }
          setAuthChecked(true)
          setLoading(false)
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        if (mounted) {
          setUser(null)
          setAuthChecked(true)
          setLoading(false)
        }
      }
    }

    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state change:', event, session?.user?.email)
        if (mounted) {
          setUser(session?.user ?? null)
          if (!authChecked) {
            setAuthChecked(true)
            setLoading(false)
          }
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [authChecked])



  if (loading && !authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Access Denied
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Please sign in to manage your interests
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col p-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            My Interests
          </h1>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          <InterestsTable />
          <AddInterestForm />
        </div>
      </div>
    </div>
  )
} 