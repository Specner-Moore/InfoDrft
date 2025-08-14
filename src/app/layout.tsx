import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navigation } from '@/components/navigation'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: 'AI Project',
  description: 'Next.js project with Supabase integration',
  keywords: ['Next.js', 'React', 'TypeScript', 'Supabase'],
  authors: [{ name: 'Your Name' }],
  creator: 'Your Name',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://your-domain.com',
    title: 'AI Project',
    description: 'Next.js project with Supabase integration',
    siteName: 'AI Project',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Project',
    description: 'Next.js project with Supabase integration',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
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