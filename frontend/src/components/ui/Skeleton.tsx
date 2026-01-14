'use client';

import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'card' | 'table';
  rows?: number;
}

export default function Skeleton({ className = '', variant = 'text', rows = 1 }: SkeletonProps) {
  const baseClasses = 'bg-gray-200 dark:bg-gray-700 rounded';
  const animateClasses = 'animate-pulse motion-reduce:animate-none';

  const containerProps = {
    role: 'status' as const,
    'aria-busy': true as const,
    'aria-label': '読み込み中',
  };

  if (variant === 'card') {
    return (
      <div
        {...containerProps}
        className={`bg-white shadow-sm rounded-xl border border-border-light dark:border-border-dark p-6 ${className}`}
      >
        <div className={animateClasses}>
          <div className="flex items-center justify-between mb-4">
            <div className={`h-4 w-1/3 ${baseClasses}`}></div>
            <div className={`h-8 w-8 ${baseClasses}`}></div>
          </div>
          <div className={`h-10 w-1/2 mb-2 ${baseClasses}`}></div>
          <div className={`h-4 w-2/3 ${baseClasses}`}></div>
        </div>
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div {...containerProps} className={className}>
        <div className={`${animateClasses} space-y-3`}>
          {Array.from({ length: rows }).map((_, index) => (
            <div key={index} className="flex space-x-4">
              <div className={`h-12 flex-1 ${baseClasses}`}></div>
              <div className={`h-12 flex-1 ${baseClasses}`}></div>
              <div className={`h-12 flex-1 ${baseClasses}`}></div>
              <div className={`h-12 w-24 ${baseClasses}`}></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div {...containerProps} className={className}>
      <div className={`${animateClasses} space-y-2`}>
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className={`h-4 ${baseClasses} ${rows > 1 && index === rows - 1 ? 'w-4/5' : 'w-full'}`}
          ></div>
        ))}
      </div>
    </div>
  );
}
