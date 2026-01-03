'use client';

import React from 'react';

type Props = {
  title?: string;
  children: React.ReactNode;
};

export default function WorkerShell({ title = 'オマモリ', children }: Props) {
  return (
    <main className="mx-auto w-full max-w-md min-h-screen flex flex-col">
      <header className="px-4 pt-6 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-warm-orange-light/40 flex items-center justify-center">
            <span className="material-icons-outlined text-warm-brown-800">shield</span>
          </div>
          <span className="text-lg font-bold">{title}</span>
        </div>
        <div className="text-xs text-warm-brown-600">{new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}</div>
      </header>

      <section className="flex-1 px-4 pb-24">{children}</section>

      <nav className="fixed bottom-0 left-0 right-0 bg-warm-surface/90 backdrop-blur border-t border-warm-brown-200/40">
        <div className="mx-auto max-w-md grid grid-cols-3 px-6 py-3 text-xs text-warm-brown-700">
          <button className="flex flex-col items-center gap-1" type="button" aria-current="page">
            <span className="material-icons-outlined text-base">home</span>
            <span>ホーム</span>
          </button>
          <button className="flex flex-col items-center gap-1" type="button">
            <span className="material-icons-outlined text-base">settings</span>
            <span>設定</span>
          </button>
          <button className="flex flex-col items-center gap-1" type="button">
            <span className="material-icons-outlined text-base">help_outline</span>
            <span>ヘルプ</span>
          </button>
        </div>
      </nav>
    </main>
  );
}
