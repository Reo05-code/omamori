// 再度メニューのコンポーネント
'use client';
import React from 'react';

export default function Sidebar({
  sidebarCollapsed,
  setSidebarCollapsed,
}: {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean | ((s: boolean) => boolean)) => void;
}) {
  return (
    <aside
      className={`${sidebarCollapsed ? 'w-20' : 'w-64'} bg-surface-light dark:bg-surface-dark border-r border-border-light dark:border-border-dark flex-col justify-between hidden md:flex transition-all duration-200 z-20 shadow-sm`}
    >
      <div>
        <div className="h-16 flex items-center justify-center border-b border-border-light dark:border-border-dark">
          <h1 className="text-xl font-bold tracking-wider text-primary dark:text-white uppercase">
            {sidebarCollapsed ? '' : 'Omamori'}
          </h1>
        </div>
        <nav className="mt-6 px-3 space-y-1">
          <a
            className={`relative group flex items-center ${sidebarCollapsed ? 'justify-center px-0 py-3' : 'px-4 py-3'} text-sm font-bold rounded-lg transition-all bg-transparent text-gray-700 hover:bg-warm-orange hover:text-white`}
            href="#"
          >
            <span className={`${sidebarCollapsed ? '' : 'mr-3'} material-icons-outlined text-xl`}>
              dashboard
            </span>
            {!sidebarCollapsed && <span className="font-semibold">ダッシュボード</span>}
          </a>
          <a
            className={`group flex items-center ${sidebarCollapsed ? 'justify-center px-0 py-3' : 'px-4 py-3'} text-sm font-medium rounded-lg transition-all bg-transparent text-gray-700 hover:bg-warm-orange hover:text-white`}
            href="#"
          >
            <span className={`${sidebarCollapsed ? '' : 'mr-3'} material-icons-outlined text-xl`}>
              people
            </span>
            {!sidebarCollapsed && <>メンバー</>}
          </a>
          <a
            className={`group flex items-center ${sidebarCollapsed ? 'justify-center px-0 py-3' : 'px-4 py-3'} text-sm font-medium rounded-lg transition-all bg-transparent text-gray-700 hover:bg-warm-orange hover:text-white`}
            href="#"
          >
            <span className={`${sidebarCollapsed ? '' : 'mr-3'} material-icons-outlined text-xl`}>
              article
            </span>
            {!sidebarCollapsed && <>作業ログ</>}
          </a>
          <a
            className={`group flex items-center ${sidebarCollapsed ? 'justify-center px-0 py-3' : 'px-4 py-3'} text-sm font-medium rounded-lg transition-all bg-transparent text-gray-700 hover:bg-warm-orange hover:text-white`}
            href="#"
          >
            <div className="flex items-center">
              <span className={`${sidebarCollapsed ? '' : 'mr-3'} material-icons-outlined text-xl`}>
                notifications
              </span>
              {!sidebarCollapsed && <>アラート</>}
            </div>
            {!sidebarCollapsed && (
              <span className="inline-flex items-center justify-center px-2 py-0.5 ml-3 text-xs font-medium text-white bg-danger rounded-full">
                3
              </span>
            )}
          </a>

          {/* collapse toggle inserted inline so it appears under Alerts */}
          <div
            className={`flex ${sidebarCollapsed ? 'justify-center' : ''} ${sidebarCollapsed ? 'px-2 py-2' : 'px-4 py-2'}`}
          >
            <button
              onClick={() => setSidebarCollapsed((s) => !s)}
              aria-label="toggle sidebar"
              aria-expanded={!sidebarCollapsed}
              title={sidebarCollapsed ? 'サイドバーを展開' : 'サイドバーを折りたたむ'}
              className={
                sidebarCollapsed
                  ? 'w-10 h-10 flex items-center justify-center rounded-lg bg-white shadow-sm border border-border-light text-gray-700 hover:bg-gray-50 transition'
                  : 'w-full flex items-center justify-between px-4 py-2 rounded-lg bg-white border border-border-light text-sm font-medium text-gray-600 hover:bg-gray-100 transition'
              }
            >
              <span className="material-icons-outlined">
                {sidebarCollapsed ? 'chevron_right' : 'chevron_left'}
              </span>
              {!sidebarCollapsed && <span className="ml-2"></span>}
            </button>
          </div>
        </nav>
      </div>
      <div className="p-3 border-t border-border-light dark:border-border-dark">
        <a
          className={`group flex items-center ${sidebarCollapsed ? 'justify-center px-0 py-3' : 'px-4 py-3'} text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white rounded-lg transition-all`}
          href="#"
        >
          <span className={`${sidebarCollapsed ? '' : 'mr-3'} material-icons-outlined text-xl`}>
            settings
          </span>
          {!sidebarCollapsed && <>設定</>}
        </a>
      </div>
    </aside>
  );
}
