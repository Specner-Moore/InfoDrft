'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'

interface AuthFormProps {
  onAuthSuccess: () => void
}

interface PasswordRequirement {
  id: string
  label: string
  test: (password: string) => boolean
}

const passwordRequirements: PasswordRequirement[] = [
  {
    id: 'length',
    label: 'At least 8 characters long',
    test: (password: string) => password.length >= 8
  },
  {
    id: 'uppercase',
    label: 'Contains at least one uppercase letter',
    test: (password: string) => /[A-Z]/.test(password)
  },
  {
    id: 'lowercase',
    label: 'Contains at least one lowercase letter',
    test: (password: string) => /[a-z]/.test(password)
  },
  {
    id: 'number',
    label: 'Contains at least one number',
    test: (password: string) => /\d/.test(password)
  },
  {
    id: 'special',
    label: 'Contains at least one special character (!@#$%^&*)',
    test: (password: string) => /[!@#$%^&*(),.?":{}|<>]/.test(password)
  }
]

//Form for signing up and signing in
export function AuthForm({ onAuthSuccess }: AuthFormProps) {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [passwordValidation, setPasswordValidation] = useState<Record<string, boolean>>({})
  
  const supabase = createClientComponentClient()
  const router = useRouter()

  // Update password validation when password changes
  useEffect(() => {
    if (isSignUp && password) {
      const validation: Record<string, boolean> = {}
      passwordRequirements.forEach(req => {
        validation[req.id] = req.test(password)
      })
      setPasswordValidation(validation)
    } else {
      setPasswordValidation({})
    }
  }, [password, isSignUp])

  // Check if all password requirements are met
  const isPasswordValid = () => {
    if (!isSignUp) return password.length >= 6 // Basic requirement for sign in
    return passwordRequirements.every(req => passwordValidation[req.id])
  }

  // Check if passwords match
  const doPasswordsMatch = () => {
    if (!isSignUp) return true // Not needed for sign in
    return password === confirmPassword
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    console.log('Starting authentication process...', { isSignUp, email })

    // Validate password for sign up
    if (isSignUp && !isPasswordValid()) {
      setMessage({ type: 'error', text: 'Please ensure your password meets all requirements.' })
      setIsLoading(false)
      return
    }

    // Check if passwords match for sign up
    if (isSignUp && !doPasswordsMatch()) {
      setMessage({ type: 'error', text: 'Passwords do not match. Please try again.' })
      setIsLoading(false)
      return
    }

    try {
      if (isSignUp) {
        console.log('Attempting to sign up user...')
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        })
        
        console.log('Sign up result:', { data: !!data, error: error?.message })
        
        if (error) {
          console.error('Sign up error:', error)
          setMessage({ type: 'error', text: error.message })
        } else if (data.user) {
          console.log('User created, attempting auto sign-in...')
          // Automatically sign in the new user
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          })
          
          if (signInError) {
            console.error('Auto sign-in error:', signInError)
            setMessage({ type: 'error', text: signInError.message })
          } else {
            console.log('Auto sign-in successful, redirecting to setup...')
            setMessage({ 
              type: 'success', 
              text: 'Account created successfully! Redirecting to setup...' 
            })
            // Redirect to setup page for new users immediately
            router.push('/setup')
          }
        } else {
          console.log('Email confirmation required')
          setMessage({ 
            type: 'success', 
            text: 'Check your email for the confirmation link!' 
          })
        }
      } else {
        console.log('Attempting to sign in user...')
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        
        console.log('Sign in result:', { data: !!data, error: error?.message })
        
        if (error) {
          console.error('Sign in error:', error)
          setMessage({ type: 'error', text: error.message })
        } else {
          console.log('Sign in successful')
          setMessage({ type: 'success', text: 'Signed in successfully!' })
          onAuthSuccess()
        }
      }
    } catch (error) {
      console.error('Unexpected error:', error)
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'An unexpected error occurred' 
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
      {/* Auth Form */}
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">
        {isSignUp ? 'Create Account' : 'Sign In'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email *
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="your@email.com"
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Password *
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={isSignUp ? 8 : 6}
            autoComplete="new-password"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder={isSignUp ? "********" : "******"}
          />
          
          {/* Password requirements for sign up */}
          {isSignUp && password && (
            <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password Requirements:
              </h4>
              <ul className="space-y-1">
                {passwordRequirements.map(req => (
                  <li key={req.id} className="flex items-center text-sm">
                    <span className={`mr-2 ${passwordValidation[req.id] ? 'text-green-500' : 'text-red-500'}`}>
                      {passwordValidation[req.id] ? 'OK' : 'X'}
                    </span>
                    <span className={passwordValidation[req.id] ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}>
                      {req.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Confirm Password field - Only for sign up */}
        {isSignUp && (
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Confirm Password *
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                confirmPassword && !doPasswordsMatch() 
                  ? 'border-red-300 dark:border-red-600' 
                  : confirmPassword && doPasswordsMatch()
                  ? 'border-green-300 dark:border-green-600'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="********"
            />
            {confirmPassword && (
              <div className="mt-1">
                {doPasswordsMatch() ? (
                  <span className="text-sm text-green-600 dark:text-green-400 flex items-center">
                    <span className="mr-1">OK</span>
                    Passwords match
                  </span>
                ) : (
                  <span className="text-sm text-red-600 dark:text-red-400 flex items-center">
                    <span className="mr-1">X</span>
                    Passwords do not match
                  </span>
                )}
              </div>
            )}
          </div>
        )}
        
        <button
          type="submit"
          disabled={isLoading || !email || !password || (isSignUp && (!isPasswordValid() || !doPasswordsMatch()))}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition duration-200 disabled:cursor-not-allowed"
        >
          {isLoading ? (isSignUp ? 'Creating Account...' : 'Signing In...') : (isSignUp ? 'Create Account' : 'Sign In')}
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
      
      {/* switch sign up/sign in button */}
      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={() => {
            setIsSignUp(!isSignUp)
            setMessage(null)
            setPassword('')
            setConfirmPassword('')
            setPasswordValidation({})
          }}
          className="text-blue-600 hover:text-blue-500 text-sm"
        >
          {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
        </button>
      </div>
    </div>
  )
} 