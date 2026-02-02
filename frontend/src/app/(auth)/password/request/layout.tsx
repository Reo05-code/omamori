import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'パスワードリセットの依頼',
  description: 'パスワード再設定のためのメール送信ページです。',
};

export default function PasswordRequestLayout({ children }: { children: React.ReactNode }) {
  return children;
}
