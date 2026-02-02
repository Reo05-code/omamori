import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '招待を受け入れる',
  description: '組織への招待を確認して承認するページです。',
};

export default function AcceptInvitationLayout({ children }: { children: React.ReactNode }) {
  return children;
}
