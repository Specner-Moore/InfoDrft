'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@/lib/supabase-client'

interface DeleteInterestButtonProps {
  interestId: number
  interestName: string
  totalInterests: number
}

export function DeleteInterestButton({ interestId, interestName, totalInterests }: DeleteInterestButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClientComponentClient()

  const handleDelete = async () => {
    if (totalInterests <= 1) {
      setError('Cannot delete the last interest. At least one interest must remain.')
      return
    }

    setIsDeleting(true)
    setError(null)

    try {
      const { error } = await supabase
        .from('interests')
        .delete()
        .eq('id', interestId)

      if (error) {
        setError(error.message)
      } else {
        // Refresh the page to show updated data
        window.location.reload()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={handleDelete}
        disabled={totalInterests <= 1 || isDeleting}
        className={`inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded ${
          totalInterests <= 1
            ? 'text-gray-400 bg-gray-100 cursor-not-allowed dark:text-gray-500 dark:bg-gray-800'
            : 'text-red-700 bg-red-100 hover:bg-red-200 dark:text-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/30'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        title={totalInterests <= 1 ? 'Cannot delete the last interest' : `Delete ${interestName}`}
      >
        {isDeleting ? 'Deleting...' : 'Delete'}
      </button>
      
      {error && (
        <div className="absolute top-full left-0 mt-1 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300 z-10 whitespace-nowrap">
          {error}
        </div>
      )}
    </div>
  )
} 