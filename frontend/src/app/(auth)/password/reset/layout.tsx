import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'パスワード再設定',
  description: '新しいパスワードを設定するページです。',
};

export default function PasswordResetLayout({ children }: { children: React.ReactNode }) {
  return children;
}
