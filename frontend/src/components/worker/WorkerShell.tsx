import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AppIcon from '../ui/AppIcon';
import Logo from '../ui/Logo';
import CurrentTime from './CurrentTime';
import { WORKER } from '@/constants/ui-messages';

type Props = {
  title?: string;
  children: React.ReactNode;
};

export default function WorkerShell({ title = WORKER.COMMON.APP_NAME, children }: Props) {
  const pathname = usePathname();

  return (
    <main className="mx-auto w-full max-w-md min-h-screen flex flex-col">
      <header className="px-3 pt-6 pb-3 flex flex-col items-center gap-4 relative">
        <div className="absolute right-2 top-6">
          <CurrentTime />
        </div>
        <div className="flex items-center gap-2">
          <Logo variant="icon" className="h-8 w-20" />
          <span className="text-lg font-bold text-warm-brown-800">Omamori</span>
        </div>
      </header>

      <section className="flex-1 px-4 pb-24">{children}</section>

      <nav className="fixed bottom-0 left-0 right-0 bg-warm-surface/90 backdrop-blur border-t border-warm-brown-200/40">
        <div className="mx-auto max-w-md grid grid-cols-3 px-6 py-3 text-xs text-warm-brown-700">
          <Link
            href="/worker"
            className={`flex flex-col items-center gap-1 transition-colors ${
              pathname === '/worker'
                ? 'text-warm-orange font-semibold'
                : 'hover:text-warm-brown-800'
            }`}
            aria-current={pathname === '/worker' ? 'page' : undefined}
          >
            <AppIcon name="home" className="text-base" />
            <span>{WORKER.NAVIGATION.HOME}</span>
          </Link>
          <Link
            href="/worker/settings"
            className={`flex flex-col items-center gap-1 transition-colors ${
              pathname === '/worker/settings'
                ? 'text-warm-orange font-semibold'
                : 'hover:text-warm-brown-800'
            }`}
            aria-current={pathname === '/worker/settings' ? 'page' : undefined}
          >
            <AppIcon name="settings" className="text-base" />
            <span>{WORKER.NAVIGATION.SETTINGS}</span>
          </Link>
          <button
            className="flex flex-col items-center gap-1 hover:text-warm-brown-800 transition-colors"
            type="button"
          >
            <AppIcon name="help_outline" className="text-base" />
            <span>{WORKER.NAVIGATION.HELP}</span>
          </button>
        </div>
      </nav>
    </main>
  );
}
