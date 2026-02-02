import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Omamoriユーザー登録',
  description: 'Omamoriの新規ユーザー登録ページです。',
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
