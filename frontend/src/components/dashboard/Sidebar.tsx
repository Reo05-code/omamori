// サイドメニューのコンポーネント
"use client";
import React from 'react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api/client';
import { API_PATHS } from '../../lib/api/paths';
import type { Organization } from '../../types';
import { usePathname } from 'next/navigation';

export default function Sidebar({
  sidebarCollapsed,
  setSidebarCollapsed,
}: {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean | ((s: boolean) => boolean)) => void;
}) {
  const [orgId, setOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);

    async function fetchOrgs() {
      try {
        const res = await api.get<Organization[]>(API_PATHS.ORGANIZATIONS.BASE, {
          signal: ctrl.signal,
        });

        if (res.error) {
          throw new Error(res.error);
        }

        const orgs = res.data || [];

        if (orgs.length === 0) {
          setOrgId(null);
        } else {
          setOrgId(String(orgs[0].id));
        }
      } catch (e: any) {
        if (e?.name === 'AbortError') return;
        console.error('failed to fetch organizations', e);
        setErrorMessage('組織の取得に失敗しました');
        window.setTimeout(() => setErrorMessage(null), 4000);
      } finally {
        setLoading(false);
      }
    }

    fetchOrgs();
    return () => ctrl.abort();
  }, []);

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
        <nav aria-label="サイドバー ナビゲーション" className="mt-6 px-3 space-y-1">
          <Link
            className={`relative group flex items-center ${sidebarCollapsed ? 'justify-center px-0 py-3' : 'px-4 py-3'} text-sm font-bold rounded-lg transition-all bg-transparent text-gray-700 hover:bg-warm-orange hover:text-white`}
            href="/dashboard"
            aria-current={pathname === '/dashboard' ? 'page' : undefined}
          >
            <span className={`${sidebarCollapsed ? '' : 'mr-3'} material-icons-outlined text-xl`}>
              {loading ? ' ' : 'dashboard'}
            </span>
            {!sidebarCollapsed && (
              loading ? (
                <span className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
              ) : (
                <span className="font-semibold">ダッシュボード</span>
              )
            )}
          </Link>
          <Link
            className={`group flex items-center ${sidebarCollapsed ? 'justify-center px-0 py-3' : 'px-4 py-3'} text-sm font-medium rounded-lg transition-all bg-transparent text-gray-700 hover:bg-warm-orange hover:text-white`}
            href={orgId ? `/dashboard/organizations/${orgId}/members` : '/dashboard/organizations'}
            aria-current={pathname?.startsWith('/dashboard/organizations') ? 'page' : undefined}
          >
            <span className={`${sidebarCollapsed ? '' : 'mr-3'} material-icons-outlined text-xl`}>
              {loading ? ' ' : 'people'}
            </span>
            {!sidebarCollapsed && (
              loading ? (
                <span className="h-4 w-16 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
              ) : (
                <>メンバー</>
              )
            )}
          </Link>
          <a
            className={`group flex items-center ${sidebarCollapsed ? 'justify-center px-0 py-3' : 'px-4 py-3'} text-sm font-medium rounded-lg transition-all bg-transparent text-gray-700 hover:bg-warm-orange hover:text-white`}
            href="#"
          >
            <span className={`${sidebarCollapsed ? '' : 'mr-3'} material-icons-outlined text-xl`}>
              {loading ? ' ' : 'article'}
            </span>
            {!sidebarCollapsed && (
              loading ? (
                <span className="h-4 w-20 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
              ) : (
                <>作業ログ</>
              )
            )}
          </a>
          <a
            className={`group flex items-center ${sidebarCollapsed ? 'justify-center px-0 py-3' : 'px-4 py-3'} text-sm font-medium rounded-lg transition-all bg-transparent text-gray-700 hover:bg-warm-orange hover:text-white`}
            href="#"
          >
            <div className="flex items-center">
              <span className={`${sidebarCollapsed ? '' : 'mr-3'} material-icons-outlined text-xl`}>
                {loading ? ' ' : 'notifications'}
              </span>
              {!sidebarCollapsed && (
                loading ? (
                  <span className="h-4 w-12 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
                ) : (
                  <>アラート</>
                )
              )}
            </div>
            {!sidebarCollapsed && (
              loading ? (
                <span className="inline-flex items-center justify-center px-2 py-0.5 ml-3 text-xs font-medium text-white bg-transparent rounded-full">
                  <span className="h-3 w-3 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                </span>
              ) : (
                <span className="inline-flex items-center justify-center px-2 py-0.5 ml-3 text-xs font-medium text-white bg-danger rounded-full">3</span>
              )
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
                {loading ? ' ' : (sidebarCollapsed ? 'chevron_right' : 'chevron_left')}
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
            {loading ? ' ' : 'settings'}
          </span>
          {!sidebarCollapsed && (
            loading ? (
              <span className="h-4 w-12 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
            ) : (
              <>設定</>
            )
          )}
        </a>
      </div>
      {errorMessage && (
        <div className="fixed right-4 bottom-4 z-50">
          <div className="bg-red-600 text-white px-4 py-2 rounded shadow">{errorMessage}</div>
        </div>
      )}
    </aside>
  );
}
