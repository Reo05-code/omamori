import type { Metadata } from 'next'
import { M_PLUS_Rounded_1c } from 'next/font/google'
import './globals.css'

const mPlusRounded = M_PLUS_Rounded_1c({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
})

export const metadata: Metadata = {
  title: 'Omamori',
  description: '高齢者・一人作業者見守りアプリケーション',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja" className={mPlusRounded.variable}>
      <body className="font-display bg-gradient-to-br from-warm-bg to-warm-brown-100 text-warm-brown-800 antialiased min-h-screen">
        {children}
      </body>
    </html>
  )
}
