'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/lib/supabase-client'
import { User } from '@supabase/supabase-js'

export function AddInterestForm() {
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [user, setUser] = useState<User | null>(null)
  
  // Create Supabase client once, outside of useEffect
  const supabase = createClientComponentClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [supabase]) // Add supabase to dependencies

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    if (!user) {
      setMessage({ type: 'error', text: 'Please sign in to add interests.' })
      setIsLoading(false)
      return
    }

    try {
      console.log('Attempting to insert interest:', { name: name.trim(), user_id: user.id })
      
      const { data, error } = await supabase
        .from('interests')
        .insert([
          {
            name: name.trim(),
            user_id: user.id
          }
        ])
        .select()

      console.log('Insert result:', { data, error })

      if (error) {
        console.error('Insert error:', error)
        setMessage({ type: 'error', text: `Database error: ${error.message}` })
      } else {
        setMessage({ type: 'success', text: 'Interest added successfully!' })
        setName('')
        // Refresh the page to show the new data
        window.location.reload()
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'An unexpected error occurred' 
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="mt-8 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4">Add New Interest</h3>
        <p className="text-gray-600 dark:text-gray-400">
          Please sign in to add interests.
        </p>
      </div>
    )
  }

  return (
    <div className="mt-8 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold mb-4">Add New Interest</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
                 <div>
           <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
             Interest Name *
           </label>
           <input
             type="text"
             id="name"
             value={name}
             onChange={(e) => setName(e.target.value)}
             required
             className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
             placeholder="e.g., Programming, Cooking, Travel"
           />
         </div>
        
        <button
          type="submit"
          disabled={isLoading || !name.trim()}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition duration-200 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Adding...' : 'Add Interest'}
        </button>
      </form>
      
      {message && (
        <div className={`mt-4 p-3 rounded-md ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200'
            : 'bg-red-50 border border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200'
        }`}>
          {message.text}
        </div>
      )}
    </div>
  )
} 