'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/lib/supabase-client'
import { DeleteInterestButton } from './delete-interest-button'

interface Interest {
  id: number
  name: string
  user_id: string
  created_at: string
}

export function InterestsTable() {
  const [interests, setInterests] = useState<Interest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Create Supabase client once, outside of useEffect
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchInterests = async () => {
      try {
        // Get the current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          setError('Authentication required. Please sign in to view your interests.')
          setLoading(false)
          return
        }
        
        // Fetch interests for the user
        const { data: interestsData, error: interestsError } = await supabase
          .from('interests')
          .select('*')
          .eq('user_id', user.id)
          .order('name', { ascending: true })

        if (interestsError) {
          setError(interestsError.message)
        } else {
          setInterests(interestsData || [])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchInterests()
  }, [supabase]) // Add supabase to dependencies

  if (loading) {
    return (
      <div className="mt-8 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4">Interests</h3>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading interests...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mt-8 p-4 rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
        <h3 className="text-lg font-semibold mb-2 text-red-800 dark:text-red-200">
          Error Loading Interests
        </h3>
        <p className="text-red-600 dark:text-red-300">{error}</p>
      </div>
    )
  }

  if (!interests || interests.length === 0) {
    return (
      <div className="mt-8 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-2">Interests</h3>
        <p className="text-gray-600 dark:text-gray-400">
          No interests found. Add some interests to get started!
        </p>
      </div>
    )
  }

  return (
    <div className="mt-8 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold mb-4">Interests</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {interests.map((interest: Interest) => (
          <div 
            key={interest.id} 
            className="flex items-center justify-between p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors min-h-[80px]"
          >
            <span className="text-base font-medium text-gray-900 dark:text-white">
              {interest.name}
            </span>
            <DeleteInterestButton 
              interestId={interest.id} 
              interestName={interest.name}
              totalInterests={interests.length}
            />
          </div>
        ))}
      </div>
      <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        Total: {interests.length} interest{interests.length !== 1 ? 's' : ''}
      </div>
    </div>
  )
} 