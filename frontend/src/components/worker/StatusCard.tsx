'use client';

import React from 'react';

type Props = {
  title: string;
  statusLabel: string;
  statusSubLabel?: string;
  // 稼働中（見守り中）かどうか。true の場合は緑アクセントを使用する
  isWorking?: boolean;
};

export default function StatusCard({
  title,
  statusLabel,
  statusSubLabel,
  isWorking = false,
}: Props) {
  const iconClass = isWorking ? 'text-secondary' : 'text-warm-orange';
  const ringClass = isWorking ? 'ring-secondary/30' : 'ring-warm-brown-200/50';

  return (
    <div
      className={`rounded-xl bg-warm-surface/80 backdrop-blur-sm shadow-soft ring-1 ${ringClass} p-4`}
    >
      <div className="text-center text-sm font-bold mb-3">{title}</div>
      <div className="flex items-center justify-center gap-2 text-lg font-bold">
        <span className={`material-icons-outlined ${iconClass}`}>check_circle</span>
        <span>{statusLabel}</span>
      </div>
      {statusSubLabel ? (
        <div className="mt-2 text-center text-xs text-warm-brown-600">{statusSubLabel}</div>
      ) : null}
    </div>
  );
}
