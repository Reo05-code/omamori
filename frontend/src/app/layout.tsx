import type { Metadata } from 'next'
import { M_PLUS_Rounded_1c } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '../context/AuthContext'

// RootLayout
// - アプリケーション全体の HTML / body 構造を定義する Next.js のルートレイアウト
// - ここでフォントやグローバルな CSS を読み込み、アプリ共通のラッパー（例: AuthProvider）を配置します
// - `AuthProvider` はクライアントサイドの認証コンテキストを提供するため、
//   レイアウト内にラップしてアプリ全体で認証状態を利用できるようにしています。
// 注意:
// - このファイルはサーバー側でレンダリングされる場合があるため、クライアント専用の処理
//  （localStorage を直接読むなど）が必要な場合は、クライアントコンポーネントで実行してください。

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
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
