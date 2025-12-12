'use client';
import React from 'react';

export default function AlertItem({
  name,
  time,
  text,
  variant = 'default',
}: {
  name: string;
  time: string;
  text: string;
  variant?: 'default' | 'important' | 'muted';
}) {
  const base = 'flex rounded-lg overflow-hidden border';
  const classes =
    variant === 'important'
      ? `${base} bg-danger/10 border border-danger/30`
      : variant === 'muted'
        ? `${base} bg-gray-50 dark:bg-slate-800/50 opacity-60 border border-gray-100 dark:border-gray-700`
        : `${base} bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-gray-700`;

  const bar =
    variant === 'important' ? 'bg-danger' : variant === 'muted' ? 'bg-green-500' : 'bg-gray-400';

  const initials = name
    .split(/\s+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className={classes}>
      <div className={`w-1.5 ${bar}`}></div>
      <div className="p-3 w-full">
        <div className="flex justify-between items-start mb-1">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-semibold mr-3 text-gray-700 dark:text-gray-100">
              {initials}
            </div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-white">{name}</h4>
          </div>
          <span className="text-xs font-mono text-gray-500 dark:text-gray-400">{time}</span>
        </div>
        <p
          className={`text-sm ${variant === 'important' ? 'text-danger dark:text-red-200 font-medium' : 'text-gray-600 dark:text-gray-300'}`}
        >
          {text}
        </p>
      </div>
    </div>
  );
}
