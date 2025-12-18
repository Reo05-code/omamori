'use client';
import React, { useEffect, useState } from 'react';
import CreateOrganizationOnboarding from '../../../components/organization/CreateOrganizationOnboarding';
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

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-gray-800 dark:text-gray-100 font-sans transition-colors duration-200">
      {/* 本番用ダッシュボード: 今は静的コンテンツを表示せずモーダルのみを残す */}
      <CreateOrganizationOnboarding />
    </div>
  );
}
