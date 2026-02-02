import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '見守りワーカー',
  description: '作業者向けの見守り画面です。',
};

export default function WorkerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-bg to-warm-brown-100 text-warm-brown-800 font-display">
      {children}
    </div>
  );
}
