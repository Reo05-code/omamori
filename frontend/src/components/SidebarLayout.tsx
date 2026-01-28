'use client';
import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './dashboard/Sidebar';
import { useAuthContext } from '../context/AuthContext';
import AppIcon from './ui/AppIcon';

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/';
  const { isAuthenticated } = useAuthContext();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // サイドバーを表示するパスプレフィックスの定義
  const shouldShowSidebar = isAuthenticated && pathname.startsWith('/dashboard');

  if (!shouldShowSidebar) return <>{children}</>;

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-gray-800 dark:text-gray-100 font-sans transition-colors duration-200">
      <div className="flex h-screen overflow-hidden">
        <Sidebar sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed} />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="h-16 bg-surface-light dark:bg-surface-dark border-b border-border-light dark:border-border-dark flex items-center justify-between px-4 sm:px-6 lg:px-8 z-10">
            <button
              className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-secondary"
              type="button"
            >
              <AppIcon name="menu" className="text-xl" />
            </button>
          </header>

          <main className="flex-1 overflow-y-auto focus:outline-none p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>

        <div className="fixed bottom-6 right-6">
          <button className="bg-primary hover:bg-gray-800 text-white w-12 h-12 rounded-full shadow-xl flex items-center justify-center transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
            <AppIcon name="help_outline" className="text-xl" />
          </button>
        </div>
      </div>
    </div>
  );
}
