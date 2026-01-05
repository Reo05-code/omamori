import React from 'react';
import AppIcon from '../ui/AppIcon';
import CurrentTime from './CurrentTime';

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
            <AppIcon name="shield" className="text-warm-brown-800 text-xl" />
          </div>
          <span className="text-lg font-bold">{title}</span>
        </div>
        <CurrentTime />
      </header>

      <section className="flex-1 px-4 pb-24">{children}</section>

      <nav className="fixed bottom-0 left-0 right-0 bg-warm-surface/90 backdrop-blur border-t border-warm-brown-200/40">
        <div className="mx-auto max-w-md grid grid-cols-3 px-6 py-3 text-xs text-warm-brown-700">
          <button className="flex flex-col items-center gap-1" type="button" aria-current="page">
            <AppIcon name="home" className="text-base" />
            <span>ホーム</span>
          </button>
          <button className="flex flex-col items-center gap-1" type="button">
            <AppIcon name="settings" className="text-base" />
            <span>設定</span>
          </button>
          <button className="flex flex-col items-center gap-1" type="button">
            <AppIcon name="help_outline" className="text-base" />
            <span>ヘルプ</span>
          </button>
        </div>
      </nav>
    </main>
  );
}
