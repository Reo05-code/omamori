"use client";
import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/dashboard/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    // フォントを読み込む（既存ページから移設）
    if (!document.querySelector('link[data-dash-font="noto-jp"]')) {
      const l = document.createElement('link');
      l.setAttribute('rel', 'stylesheet');
      l.setAttribute(
        'href',
        'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap',
      );
      l.setAttribute('data-dash-font', 'noto-jp');
      document.head.appendChild(l);
    }

    // Material Iconを読み込む
    if (!document.querySelector('link[data-dash-icons="material"]')) {
      const l2 = document.createElement('link');
      l2.setAttribute('rel', 'stylesheet');
      l2.setAttribute('href', 'https://fonts.googleapis.com/icon?family=Material+Icons+Outlined');
      l2.setAttribute('data-dash-icons', 'material');
      document.head.appendChild(l2);
    }
  }, []);

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
              <span className="material-icons-outlined">menu</span>
            </button>
            <div className="flex-1 flex justify-center lg:justify-start lg:ml-6">
              <div className="w-full max-w-lg lg:max-w-xs relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-icons-outlined text-warm-brown-600 text-lg">search</span>
                </div>
                <input
                  id="search"
                  name="search"
                  placeholder="作業員や現場を検索..."
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-800 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-secondary focus:border-secondary sm:text-sm text-gray-900 dark:text-gray-100 transition duration-150 ease-in-out shadow-inner-soft"
                />
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto focus:outline-none p-4 sm:p-6 lg:p-8">{children}</main>
        </div>

        <div className="fixed bottom-6 right-6">
          <button className="bg-primary hover:bg-gray-800 text-white w-12 h-12 rounded-full shadow-xl flex items-center justify-center transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
            <span className="material-icons-outlined">help_outline</span>
          </button>
        </div>
      </div>
    </div>
  );
}
