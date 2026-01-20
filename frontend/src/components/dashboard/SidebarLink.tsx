// 「アイコン」と「文字」がセットになったメニューボタンコンポーネント

'use client';

import Link from 'next/link';

import AppIcon, { type AppIconName } from '../ui/AppIcon';

type SidebarLinkProps = {
  href: string;
  iconName: AppIconName;
  label: string;
  isActive: boolean;
  isLoading: boolean;
  // サイドバーが折りたたまれているかどうか
  collapsed: boolean;
  onClick?: () => void;
};

export default function SidebarLink({
  href,
  iconName,
  label,
  isActive,
  isLoading,
  collapsed,
  onClick,
}: SidebarLinkProps) {
  const baseClass = 'group flex items-center text-sm font-medium rounded-lg transition-all';
  const layoutClass = collapsed ? 'justify-center px-0 py-3' : 'px-4 py-3';

  const colorClass = isActive
    ? 'bg-warm-orange text-white'
    : 'bg-transparent text-gray-700 hover:bg-warm-orange hover:text-white dark:text-gray-400 dark:hover:text-white';

  const iconClass = `text-xl ${collapsed ? '' : 'mr-3'}`;

  return (
    <Link
      href={href}
      className={`${baseClass} ${layoutClass} ${colorClass}`}
      aria-current={isActive ? 'page' : undefined}
      onClick={() => onClick?.()}
    >
      <AppIcon name={iconName} className={iconClass} />

      {!collapsed &&
        (isLoading ? (
          <span className="h-4 w-20 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
        ) : (
          <span>{label}</span>
        ))}
    </Link>
  );
}
