'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/lib/supabase-client'
import { Session, User } from '@supabase/supabase-js'

interface AuthState {
  session?: Session | null
  user?: User | null
  sessionError?: string
  userError?: string
  error?: string
}

export function AuthTest() {
  const [authState, setAuthState] = useState<AuthState>({})
  const [loading, setLoading] = useState(true)
  
  const supabase = createClientComponentClient()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        setAuthState({
          session,
          user,
          sessionError: sessionError?.message,
          userError: userError?.message
        })
      } catch (error) {
        setAuthState({
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [supabase])

  const handleSignOut = async () => {
    try {
      console.log('Attempting to sign out...')
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Sign out error:', error)
        alert(`Sign out error: ${error.message}`)
      } else {
        console.log('Sign out successful')
        alert('Sign out successful!')
        window.location.reload()
      }
    } catch (error) {
      console.error('Sign out error:', error)
      alert(`Sign out error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  if (loading) {
    return (
      <div className="mt-8 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4">Authentication Test</h3>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="mt-8 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold mb-4">Authentication Test</h3>
      
      <div className="space-y-4 text-sm">
        <div>
          <strong>Session:</strong> {authState.session ? '✅ Active' : '❌ None'}
        </div>
        
        <div>
          <strong>User:</strong> {authState.user ? `✅ ${authState.user.email}` : '❌ None'}
        </div>
        
        {authState.sessionError && (
          <div className="text-red-600 dark:text-red-400">
            <strong>Session Error:</strong> {authState.sessionError}
          </div>
        )}
        
        {authState.userError && (
          <div className="text-red-600 dark:text-red-400">
            <strong>User Error:</strong> {authState.userError}
          </div>
        )}
        
        {authState.error && (
          <div className="text-red-600 dark:text-red-400">
            <strong>General Error:</strong> {authState.error}
          </div>
        )}
        
        <div className="mt-4">
          <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md"
          >
            Test Sign Out
          </button>
        </div>
        
        {authState.user && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200">
            <p className="font-medium">Current User Details:</p>
            <p className="text-xs mt-1">ID: {authState.user.id}</p>
            <p className="text-xs">Email: {authState.user.email}</p>
            <p className="text-xs">Created: {new Date(authState.user.created_at).toLocaleString()}</p>
          </div>
        )}
      </div>
    </div>
  )
} 