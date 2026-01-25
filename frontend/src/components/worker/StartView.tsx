'use client';

import React from 'react';
import PrimaryButton from '../ui/PrimaryButton';
import AppIcon from '../ui/AppIcon';
import { WORKER } from '@/constants/ui-messages';

type Props = {
  onStart: () => void;
  loading?: boolean;
};

/**
 * 見守り開始前の画面
 * - 説明カード
 * - 開始ボタン（大）
 */
export default function StartView({ onStart, loading = false }: Props) {
  return (
    <div className="space-y-6">
      {/* 説明カード */}
      <div className="bg-warm-surface/80 backdrop-blur-sm rounded-2xl shadow-soft ring-1 ring-warm-brown-200/30 p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-warm-orange-light/40 flex items-center justify-center flex-shrink-0">
            <AppIcon name="shield" className="text-warm-brown-800 text-xl" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-warm-brown-800 mb-1">
              {WORKER.MONITORING.HEADINGS.START_TITLE}
            </h2>
            <p className="text-sm text-warm-brown-600">{WORKER.MONITORING.MESSAGES.DESCRIPTION}</p>
          </div>
        </div>

        <ul className="space-y-2 text-sm text-warm-brown-700">
          <li className="flex items-start gap-2">
            <AppIcon name="check_circle" className="text-base text-secondary mt-0.5" />
            <span>{WORKER.CHECK_IN.LABELS.PERIODIC}</span>
          </li>
          <li className="flex items-start gap-2">
            <AppIcon name="check_circle" className="text-base text-secondary mt-0.5" />
            <span>{WORKER.SOS.LABELS.FEATURE}</span>
          </li>
          <li className="flex items-start gap-2">
            <AppIcon name="check_circle" className="text-base text-secondary mt-0.5" />
            <span>{WORKER.MONITORING.MESSAGES.LOCATION_TRACKING}</span>
          </li>
        </ul>
      </div>

      {/* 開始ボタン */}
      <PrimaryButton onClick={onStart} loading={loading} disabled={loading}>
        <span className="flex items-center justify-center gap-2">
          <AppIcon name="play_circle" className="text-xl" />
          <span className="text-base font-bold">見守りを開始</span>
        </span>
      </PrimaryButton>
    </div>
  );
}
