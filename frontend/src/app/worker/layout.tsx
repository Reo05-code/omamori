import React from 'react';

export default function WorkerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-bg to-warm-brown-100 text-warm-brown-800 font-display">
      {children}
    </div>
  );
}
