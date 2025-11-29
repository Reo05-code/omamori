import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Rails + Next.js App',
  description: 'Full-stack application with Rails API and Next.js frontend',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
