import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navigation } from '@/components/navigation'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: 'InfoDrft',
  description: 'A news application that uses AI to filter news articles based on your interests.',
  keywords: ['Next.js', 'React', 'TypeScript', 'Supabase'],
  authors: [{ name: 'Spencer Moore' }],
  creator: 'Spencer Moore',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://infodrft.com',
    title: 'InfoDrft',
    description: 'A news application that uses AI to filter news articles based on your interests.',
    siteName: 'InfoDrft',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <div className="min-h-screen bg-background text-foreground">
          <Navigation />
          <main className="pt-16">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
} 