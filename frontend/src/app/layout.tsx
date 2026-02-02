import type { Metadata } from 'next';
import { M_PLUS_Rounded_1c } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '../context/AuthContext';

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
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  title: {
    default: 'Omamori - 高齢者・一人作業者見守りアプリ',
    template: '%s | Omamori',
  },
  description:
    '高齢者・一人作業者を見守るための総合プラットフォーム。位置情報、生存報告、リスク評価、アラート機能で安全を実現。',
  metadataBase: new URL(siteUrl),
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    shortcut: ['/favicon.svg'],
  },
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    url: siteUrl,
    title: 'Omamori - 高齢者・一人作業者見守りアプリ',
    description: '安全・安心を実現する見守りプラットフォーム。',
    siteName: 'Omamori',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Omamori ロゴ',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Omamori - 高齢者・一人作業者見守りアプリ',
    description: '安全・安心を実現する見守りプラットフォーム。',
    images: ['/images/og-image.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={mPlusRounded.variable}>
      <body className="font-display bg-gradient-to-br from-warm-bg to-warm-brown-100 text-warm-brown-800 antialiased min-h-screen">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
