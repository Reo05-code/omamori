"use client";
import React, { useEffect, useState } from 'react';
import { api } from '../../../lib/api/client';
import CreateOrganizationModal from '../../../components/CreateOrganizationModal';
import Sidebar from '../../../components/dashboard/Sidebar';
import AlertItem from '../../../components/common/AlertItem';

export default function ProductionPage() {
  const toggleDark = () => {
    if (typeof document !== 'undefined') document.documentElement.classList.toggle('dark');
  };

  useEffect(() => {
    if (typeof document === 'undefined') return;

    // フォントを読み込む
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

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showCreateOrgModal, setShowCreateOrgModal] = useState(false);

  // 組織が存在するかチェック（オンボーディング時にモーダルを強制表示するため）
  useEffect(() => {
    let mounted = true;
    async function fetchOrgs() {
      const res = await api.get<any[]>('/api/v1/organizations');
      // デバッグログ: レスポンス全体を出す
      // ブラウザの DevTools Console で確認してください
      // eslint-disable-next-line no-console
      console.log('GET /api/v1/organizations ->', res);
      if (!mounted) return;
      if (res.error) {
        console.warn('organizations fetch error', res.error);
        return;
      }

      const orgs = res.data || [];
      if (orgs.length === 0) {
        // ハードブロッキング（オンボーディング）モードで表示
        setShowCreateOrgModal(true);
      }
    }

    fetchOrgs();
    // クエリパラメータで強制表示（テスト用）
    try {
      const qs = new URLSearchParams(window.location.search);
      if (qs.get('force_create') === '1') {
        // eslint-disable-next-line no-console
        console.log('force_create=1 -> opening create org modal');
        setShowCreateOrgModal(true);
      }
    } catch (e) {
      // noop
    }
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-gray-800 dark:text-gray-100 font-sans transition-colors duration-200">
      {/* 本番用ダッシュボード: 今は静的コンテンツを表示せずモーダルのみを残す */}
      <CreateOrganizationModal
        open={showCreateOrgModal}
        forceCreate={true}
        onCreated={() => {
          setShowCreateOrgModal(false);
          if (typeof window !== 'undefined') window.location.reload();
        }}
      />
    </div>
  );
}
