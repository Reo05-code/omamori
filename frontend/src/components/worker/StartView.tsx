'use client';

import React from 'react';
import PrimaryButton from '../ui/PrimaryButton';
import AppIcon from '../ui/AppIcon';

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
            <h2 className="text-lg font-bold text-warm-brown-800 mb-1">見守りを開始しましょう</h2>
            <p className="text-sm text-warm-brown-600">
              作業を開始すると、定期的な安否確認と緊急時のSOS発信ができるようになります。
            </p>
          </div>
        </div>

        <ul className="space-y-2 text-sm text-warm-brown-700">
          <li className="flex items-start gap-2">
            <AppIcon name="check_circle" className="text-base text-secondary mt-0.5" />
            <span>元気タッチで定期的に安否を報告</span>
          </li>
          <li className="flex items-start gap-2">
            <AppIcon name="check_circle" className="text-base text-secondary mt-0.5" />
            <span>緊急時は長押しでSOS発信</span>
          </li>
          <li className="flex items-start gap-2">
            <AppIcon name="check_circle" className="text-base text-secondary mt-0.5" />
            <span>管理者が位置情報を確認</span>
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
