import React from 'react';
import Link from 'next/link';
import AppIcon from '../ui/AppIcon';

type DashboardCardVariant = 'default' | 'alert';

type IconName = string;

interface DashboardCardProps {
  title: string;
  value: string | number;
  valueColor?: string;
  icon?: IconName;
  iconColor?: string;
  statusText?: string;
  statusColor?: string;
  statusIcon?: IconName;
  href?: string;
  variant?: DashboardCardVariant;
}

export default function DashboardCard({
  title,
  value,
  valueColor = 'text-gray-900 dark:text-white',
  icon,
  iconColor = 'text-gray-400 dark:text-gray-500',
  statusText,
  statusColor = 'text-gray-500 dark:text-gray-400',
  statusIcon,
  href,
  variant = 'default',
}: DashboardCardProps) {
  const cardContent = (
    <>
      {variant === 'alert' && (
        <span
          className="absolute left-0 top-0 bottom-0 w-1.5 bg-danger rounded-r-md"
          aria-hidden="true"
        />
      )}
      <div
        className={`flex items-center justify-between mb-4 ${variant === 'alert' ? 'pl-4' : ''}`}
      >
        <h3
          className={`text-sm font-medium ${variant === 'alert' ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`}
        >
          {title}
        </h3>
        {icon && <AppIcon name={icon as any} className={`${iconColor} text-2xl`} />}
      </div>
      <div className={`flex items-baseline ${variant === 'alert' ? 'pl-4' : ''}`}>
        <span className={`text-4xl font-bold ${valueColor}`}>{value}</span>
      </div>
      {statusText && (
        <div
          className={`mt-2 text-sm flex items-center ${statusColor} ${variant === 'alert' ? 'font-semibold pl-4' : ''}`}
        >
          {statusIcon && <AppIcon name={statusIcon as any} className="text-base mr-1" />}
          <span>{statusText}</span>
        </div>
      )}
    </>
  );

  const cardClasses = `relative bg-white overflow-hidden shadow-sm rounded-xl border border-border-light dark:border-border-dark flex flex-col p-6 ${href ? 'hover:translate-x-1 transition-transform' : ''}`;

  if (href) {
    return (
      <Link href={href} className={cardClasses}>
        {cardContent}
      </Link>
    );
  }

  return <div className={cardClasses}>{cardContent}</div>;
}
