'use client';

import React, { useEffect } from 'react';

export default function WorkerLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof document === 'undefined') return;

    // Worker 画面でも Material Icon を利用できるようにする
    if (!document.querySelector('link[data-worker-icons="material"]')) {
      const l = document.createElement('link');
      l.setAttribute('rel', 'stylesheet');
      l.setAttribute('href', 'https://fonts.googleapis.com/icon?family=Material+Icons+Outlined');
      l.setAttribute('data-worker-icons', 'material');
      document.head.appendChild(l);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-bg to-warm-brown-100 text-warm-brown-800 font-display">
      {children}
    </div>
  );
}
