'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

import { api } from '../../lib/api/client';
import { API_PATHS } from '../../lib/api/paths';
import type { Organization } from '../../types';
import AppIcon from '../ui/AppIcon';
import SidebarLink from './SidebarLink';
import { useAuthContext } from '@/context/AuthContext';
import { getUserRole } from '@/lib/permissions';
import { DASHBOARD } from '@/constants/ui-messages';

// --------------------------------------------------------------------------
// Main Component: Sidebar
// --------------------------------------------------------------------------

export default function Sidebar({
  sidebarCollapsed,
  setSidebarCollapsed,
  onClose,
  isMobile = false,
}: {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean | ((s: boolean) => boolean)) => void;
  onClose?: () => void;
  isMobile?: boolean;
}) {
  const [orgId, setOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Ref & Hooks
  // タイムアウトIDを保持するためのRef (メモリリーク防止)
  const errorTimeoutRef = useRef<number | null>(null);
  const pathname = usePathname();
  const { user } = useAuthContext();

  // --------------------------------------------------------------------------
  // Derived State (ロジック)
  // --------------------------------------------------------------------------

  const currentOrgId = useMemo(() => {
    const match = pathname?.match(/^\/dashboard\/organizations\/(\d+)(?:\/|$)/);
    if (match?.[1]) return match[1];
    return orgId;
  }, [pathname, orgId]);

  const isAdminForCurrentOrg = useMemo(() => {
    if (!currentOrgId) return false;
    return getUserRole(user, currentOrgId) === 'admin';
  }, [user, currentOrgId]);

  // パス判定ロジック
  // 正規表現を毎回生成しないよう、定数化またはuseMemo内で完結させる
  const isDashboardPath = useMemo(() => {
    if (!pathname) return false;
    if (pathname === '/dashboard') return true;
    if (!/^\/dashboard\/organizations\/\d+(?:\/|$)/.test(pathname)) return false;
    return !/\/(members|work_logs|alerts|settings)(?:\/|$)/.test(pathname);
  }, [pathname]);

  const isMembersPath = useMemo(() => {
    if (!pathname) return false;
    return /\/members(?:\/|$)/.test(pathname);
  }, [pathname]);

  const isWorkLogsPath = useMemo(() => {
    if (!pathname) return false;
    return /\/work_logs(?:\/|$)/.test(pathname);
  }, [pathname]);

  const isAlertsPath = useMemo(() => {
    if (!pathname) return false;
    return /\/alerts(?:\/|$)/.test(pathname);
  }, [pathname]);

  const isSettingsPath = useMemo(() => {
    if (!pathname) return false;
    return /\/settings(?:\/|$)/.test(pathname);
  }, [pathname]);

  // --------------------------------------------------------------------------
  // Data Fetching
  // --------------------------------------------------------------------------

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);

    async function fetchOrgs() {
      try {
        const res = await api.get<Organization[]>(API_PATHS.ORGANIZATIONS.BASE, {
          signal: ctrl.signal,
        });

        if (res.error) throw new Error(res.error);

        const orgs = res.data || [];
        setOrgId(orgs.length > 0 ? String(orgs[0].id) : null);
      } catch (e: any) {
        if (e?.name === 'AbortError') return;
        console.error('failed to fetch organizations', e);
        setErrorMessage(DASHBOARD.STATUS.ERROR);

        if (errorTimeoutRef.current !== null) {
          window.clearTimeout(errorTimeoutRef.current);
        }
        errorTimeoutRef.current = window.setTimeout(() => setErrorMessage(null), 4000);
      } finally {
        setLoading(false);
      }
    }

    fetchOrgs();
    return () => {
      ctrl.abort();
      if (errorTimeoutRef.current !== null) {
        window.clearTimeout(errorTimeoutRef.current);
      }
    };
  }, []);

  // --------------------------------------------------------------------------
  // Render Helpers
  // --------------------------------------------------------------------------

  const baseBackgroundClassName = isMobile
    ? 'bg-warm-bg dark:bg-[#0f172a]'
    : 'bg-surface-light dark:bg-surface-dark';
  const zIndexClassName = isMobile ? 'z-[100]' : 'z-20';
  const widthClassName = sidebarCollapsed ? 'w-20' : 'w-64';
  const visibilityClassName = isMobile ? 'flex' : 'hidden md:flex';

  const containerClass = `${widthClassName} ${baseBackgroundClassName} border-r border-border-light dark:border-border-dark flex-col justify-between transition-all duration-200 ${zIndexClassName} shadow-sm ${visibilityClassName}`;

  // --------------------------------------------------------------------------
  // JSX
  // --------------------------------------------------------------------------

  return (
    <aside className={containerClass}>
      <div>
        {/* Header */}
        <div className="h-16 flex items-center justify-center border-b border-border-light dark:border-border-dark">
          <h1 className="text-xl font-bold tracking-wider text-primary dark:text-white uppercase">
            {sidebarCollapsed ? '' : 'Omamori'}
          </h1>
        </div>

        {/* Navigation Links */}
        <nav aria-label="サイドバー ナビゲーション" className="mt-6 px-3 space-y-1">
          <SidebarLink
            href={orgId ? `/dashboard/organizations/${orgId}` : '/dashboard'}
            iconName="dashboard"
            label={DASHBOARD.NAVIGATION.ITEMS.DASHBOARD}
            isActive={isDashboardPath}
            isLoading={loading}
            collapsed={sidebarCollapsed}
            onClick={onClose}
          />

          <SidebarLink
            href={orgId ? `/dashboard/organizations/${orgId}/members` : '/dashboard/organizations'}
            iconName="people"
            label={DASHBOARD.NAVIGATION.ITEMS.MEMBERS}
            isActive={isMembersPath}
            isLoading={loading}
            collapsed={sidebarCollapsed}
            onClick={onClose}
          />

          <SidebarLink
            href={orgId ? `/dashboard/organizations/${orgId}/work_logs` : '/dashboard'}
            iconName="article"
            label={DASHBOARD.NAVIGATION.ITEMS.WORK_LOGS}
            isActive={isWorkLogsPath}
            isLoading={loading}
            collapsed={sidebarCollapsed}
            onClick={onClose}
          />

          {isAdminForCurrentOrg && (
            <SidebarLink
              href={currentOrgId ? `/dashboard/organizations/${currentOrgId}/alerts` : '/dashboard'}
              iconName="notifications"
              label={DASHBOARD.NAVIGATION.ITEMS.ALERTS}
              isActive={isAlertsPath}
              isLoading={loading}
              collapsed={sidebarCollapsed}
              onClick={onClose}
            />
          )}

          {/* Collapse Button (Mobile以外) */}
          {!isMobile && (
            <div className={`flex ${sidebarCollapsed ? 'justify-center px-2 py-2' : 'px-4 py-2'}`}>
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
                <AppIcon
                  name={sidebarCollapsed ? 'chevron_right' : 'chevron_left'}
                  className="text-xl"
                />
              </button>
            </div>
          )}
        </nav>
      </div>

      {/* Footer Settings Area */}
      <div className="p-3 border-t border-border-light dark:border-border-dark">
        {isAdminForCurrentOrg && currentOrgId && (
          <SidebarLink
            href={`/dashboard/organizations/${currentOrgId}/settings`}
            iconName="settings"
            label={DASHBOARD.NAVIGATION.ITEMS.SETTINGS}
            isActive={isSettingsPath}
            isLoading={loading}
            collapsed={sidebarCollapsed}
            onClick={onClose}
          />
        )}
      </div>

      {/* Error Toast */}
      {errorMessage && (
        <div className="fixed right-4 bottom-4 z-50">
          <div className="bg-red-600 text-white px-4 py-2 rounded shadow">{errorMessage}</div>
        </div>
      )}
    </aside>
  );
}
