'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { InterestsProvider, useInterests } from '@/components/interests-context'
import { CommonInterestsTable } from '@/components/common-interests-table'

// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic'


function SetupContent() {
  const [user, setUser] = useState<User | null>(null)
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [customInterest, setCustomInterest] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  const { interests, loading: interestsLoading, addInterest } = useInterests()
  const router = useRouter()

  //check if user is authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClientComponentClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) {
          router.push('/')
          return
        }
        setUser(session.user)
      } catch (error) {
        console.error('Error checking auth:', error)
        // If there's an error with Supabase, redirect to home
        router.push('/')
      }
    }
    checkAuth()
  }, [router])

  // Check if user already has interests - only redirect when we're certain they have some
  useEffect(() => {
    if (user && !interestsLoading && interests.length > 0) {
      console.log('User already has interests, redirecting to main page')
      router.push('/')
    }
  }, [user, interestsLoading, interests.length, router])

  //toggle interest being selected
  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    )
  }

  //add custom interest
  const addCustomInterest = () => {
    if (customInterest.trim() && !selectedInterests.includes(customInterest.trim())) {
      setSelectedInterests(prev => [...prev, customInterest.trim()])
      setCustomInterest('')
    }
  }

  //remove interest from selected interests
  const removeInterest = (interest: string) => {
    setSelectedInterests(prev => prev.filter(i => i !== interest))
  }

  //save selected interests
  const handleSave = async () => {
    if (selectedInterests.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one interest to continue.' })
      return
    }

    setIsSaving(true)
    setMessage(null)

    try {
      // Add each selected interest using the context
      for (const interestName of selectedInterests) {
        const result = await addInterest(interestName)
        if (!result.success) {
          setMessage({ type: 'error', text: result.error || 'Failed to save some interests. Please try again.' })
          setIsSaving(false)
          return
        }
      }

      setMessage({ type: 'success', text: 'Interests saved successfully! Redirecting to your personalized news...' })
      
      // Redirect to main page after a short delay
      setTimeout(() => {
        router.push('/')
      }, 3000)

    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to save interests. Please try again.' 
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Show loading while checking auth or interests
  if (!user || interestsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome to InfoDrft!
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-2">
            Let&apos;s personalize your news experience
          </p>
          <p className="text-gray-500 dark:text-gray-500">
            Select your interests to get started with personalized news recommendations
          </p>
        </div>

        <CommonInterestsTable
          selectedInterests={selectedInterests}
          onToggleInterest={toggleInterest}
          onAddCustomInterest={addCustomInterest}
          onRemoveInterest={removeInterest}
          customInterest={customInterest}
          setCustomInterest={setCustomInterest}
          isSaving={isSaving}
        />

        {/* Message Display */}
        {message && (
          <div className={`mt-6 p-4 rounded-md ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200'
              : 'bg-red-50 border border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* Action Button */}
        <div className="flex justify-center mt-6">
          <button
            onClick={handleSave}
            disabled={selectedInterests.length === 0 || isSaving}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-md transition-colors disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : `Save ${selectedInterests.length} Interest${selectedInterests.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SetupPage() {
  return (
    <InterestsProvider>
      <SetupContent />
    </InterestsProvider>
  )
} 