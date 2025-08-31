'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { createClientComponentClient } from '@/lib/supabase-client'

interface Interest {
  id: number
  name: string
  user_id: string
  created_at: string
}

interface InterestsContextType {
  interests: Interest[]
  loading: boolean
  error: string | null
  addInterest: (name: string) => Promise<{ success: boolean; error?: string }>
  deleteInterest: (id: number) => Promise<{ success: boolean; error?: string }>
  refreshInterests: () => Promise<void>
}

const InterestsContext = createContext<InterestsContextType | undefined>(undefined)

export function useInterests() {
  const context = useContext(InterestsContext)
  if (context === undefined) {
    throw new Error('useInterests must be used within an InterestsProvider')
  }
  return context
}

interface InterestsProviderProps {
  children: ReactNode
}

export function InterestsProvider({ children }: InterestsProviderProps) {
  const [interests, setInterests] = useState<Interest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClientComponentClient()

  const fetchInterests = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        setError('Authentication required. Please sign in to view your interests.')
        setInterests([])
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
        setInterests([])
      } else {
        setInterests(interestsData || [])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      setInterests([])
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const addInterest = async (name: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        return { success: false, error: 'Authentication required. Please sign in to add interests.' }
      }

      // Check if interest already exists
      const existingInterest = interests.find(interest => 
        interest.name.toLowerCase() === name.trim().toLowerCase()
      )
      
      if (existingInterest) {
        return { success: false, error: 'This interest already exists.' }
      }

      // Insert new interest
      const { data, error } = await supabase
        .from('interests')
        .insert([{ name: name.trim(), user_id: user.id }])
        .select()

      if (error) {
        return { success: false, error: error.message }
      }

      // Update local state
      if (data && data[0]) {
        setInterests(prev => [...prev, data[0]])
      }

      return { success: true }
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'An unexpected error occurred' 
      }
    }
  }

  const deleteInterest = async (id: number): Promise<{ success: boolean; error?: string }> => {
    try {
      // Check if this would be the last interest
      if (interests.length <= 1) {
        return { success: false, error: 'Cannot delete the last interest. At least one interest must remain.' }
      }

      // Delete from database
      const { error } = await supabase
        .from('interests')
        .delete()
        .eq('id', id)

      if (error) {
        return { success: false, error: error.message }
      }

      // Update local state
      setInterests(prev => prev.filter(interest => interest.id !== id))

      return { success: true }
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'An unexpected error occurred' 
      }
    }
  }

  // Initial fetch on mount
  useEffect(() => {
    fetchInterests()
  }, [fetchInterests])

  const value: InterestsContextType = {
    interests,
    loading,
    error,
    addInterest,
    deleteInterest,
    refreshInterests: fetchInterests
  }

  return (
    <InterestsContext.Provider value={value}>
      {children}
    </InterestsContext.Provider>
  )
}
