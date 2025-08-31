'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/lib/supabase-client'
import { User } from '@supabase/supabase-js'

export function Navigation() {
  const pathname = usePathname()
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navItems = [
    { href: '/', label: 'News' },
    { href: '/interests', label: 'Interests' },
  ]

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const supabase = createClientComponentClient()
        // Get current user
        const getSession = async () => {
          const { data: { session } } = await supabase.auth.getSession()
          setUser(session?.user ?? null)
        }

        getSession()

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, session) => {
            setUser(session?.user ?? null)
          }
        )

        return () => subscription.unsubscribe()
      } catch (error) {
        console.error('Error initializing auth:', error)
      }
    }

    initializeAuth()
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      // Always show navigation at the top of the page
      if (currentScrollY <= 10) {
        setIsVisible(true)
      } else {
        // Show navigation when scrolling up, hide when scrolling down
        setIsVisible(currentScrollY < lastScrollY)
      }
      
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [lastScrollY])

  const handleSignOut = async () => {
    setIsLoading(true)
    try {
      const supabase = createClientComponentClient()
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Sign out error:', error.message)
        alert(`Sign out error: ${error.message}`)
      } else {
        console.log('Sign out successful')
        // Redirect to home page which will show the sign-in form
        window.location.href = '/'
      }
    } catch (error) {
      console.error('Sign out error:', error)
      alert(`Sign out error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  // Don't render navigation if user is not signed in
  if (!user) {
    return null
  }

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm transition-transform duration-200 ease-out ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo - Always visible */}
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  InfoDrft
                </h1>
              </div>
            </div>
            
            {/* Desktop Navigation - Hidden on mobile */}
            <div className="hidden md:flex items-center space-x-8">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800'
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              })}
              
              {/* Sign Out Button - Only show when user is signed in */}
              {user && (
                <button
                  onClick={handleSignOut}
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Signing out...' : 'Sign Out'}
                </button>
              )}
            </div>

            {/* Mobile menu button - Only visible on mobile */}
            <div className="md:hidden flex items-center">
              <button
                onClick={toggleMobileMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                aria-expanded="false"
                aria-label="Toggle navigation menu"
              >
                <span className="sr-only">Open main menu</span>
                {/* Hamburger icon */}
                <svg
                  className={`${isMobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
                {/* Close icon */}
                <svg
                  className={`${isMobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile menu - Full screen overlay outside of nav */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-white dark:bg-gray-900">
          <div className="flex flex-col items-center justify-center h-full space-y-8">
            {/* Close button at top */}
            <div className="absolute top-4 right-4">
              <button
                onClick={closeMobileMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                aria-label="Close navigation menu"
              >
                <svg
                  className="h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Navigation items centered */}
            <div className="flex flex-col items-center space-y-6">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMobileMenu}
                    className={`inline-flex items-center px-6 py-3 text-xl font-medium rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800'
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              })}
              
              {/* Sign Out Button for mobile - Only show when user is signed in */}
              {user && (
                <button
                  onClick={() => {
                    closeMobileMenu()
                    handleSignOut()
                  }}
                  disabled={isLoading}
                  className="inline-flex items-center px-6 py-3 text-xl font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Signing out...' : 'Sign Out'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
} 