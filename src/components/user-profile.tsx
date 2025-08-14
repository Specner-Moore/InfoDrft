'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@/lib/supabase-client'

interface UserProfileProps {
  user: {
    id: string
    email: string
  }
  onSignOut: () => void
}

export function UserProfile({ user, onSignOut }: UserProfileProps) {
  const [isLoading, setIsLoading] = useState(false)
  // Create Supabase client once, outside of useEffect
  const supabase = createClientComponentClient()

  const handleSignOut = async () => {
    setIsLoading(true)
    try {
      console.log('UserProfile: Attempting to sign out...')
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('UserProfile: Sign out error:', error.message)
        alert(`Sign out error: ${error.message}`)
      } else {
        console.log('UserProfile: Sign out successful')
        onSignOut()
        window.location.reload()
      }
    } catch (error) {
      console.error('UserProfile: Sign out error:', error)
      alert(`Sign out error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
          <span className="text-blue-600 dark:text-blue-300 font-semibold text-sm">
            {user.email.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {user.email}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            User ID: {user.id.slice(0, 8)}...
          </p>
        </div>
      </div>
      
      <button
        onClick={handleSignOut}
        disabled={isLoading}
        className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Signing out...' : 'Sign Out'}
      </button>
    </div>
  )
} 