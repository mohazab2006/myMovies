import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'myMovies - AI Movie Recommendations',
  description: 'Get personalized movie recommendations powered by AI',
  icons: {
    icon: '/logo.jpg',
    shortcut: '/logo.jpg',
    apple: '/logo.jpg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

