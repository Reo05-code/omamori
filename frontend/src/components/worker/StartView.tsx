'use client';

import React from 'react';
import PrimaryButton from '../ui/PrimaryButton';
import LongPressButton from '../ui/LongPressButton';

type Props = {
  onStart: () => void;
  onSos: () => void;
  loading?: boolean;
  sosLoading?: boolean;
};

/**
 * 見守り開始前の画面
 * - 説明カード
 * - 開始ボタン（大）
 * - SOS（小、セッション無しで押すと開始を促す）
 */
export default function StartView({ onStart, onSos, loading = false, sosLoading = false }: Props) {
  return (
    <div className="space-y-6">
      {/* 説明カード */}
      <div className="bg-warm-surface/80 backdrop-blur-sm rounded-2xl shadow-soft ring-1 ring-warm-brown-200/30 p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-warm-orange-light/40 flex items-center justify-center flex-shrink-0">
            <span className="material-icons-outlined text-warm-brown-800">shield</span>
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
            <span className="material-icons-outlined text-base text-secondary mt-0.5">
              check_circle
            </span>
            <span>元気タッチで定期的に安否を報告</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="material-icons-outlined text-base text-secondary mt-0.5">
              check_circle
            </span>
            <span>緊急時は長押しでSOS発信</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="material-icons-outlined text-base text-secondary mt-0.5">
              check_circle
            </span>
            <span>管理者が位置情報を確認</span>
          </li>
        </ul>
      </div>

      {/* 開始ボタン */}
      <PrimaryButton onClick={onStart} loading={loading} disabled={loading}>
        <span className="flex items-center justify-center gap-2">
          <span className="material-icons-outlined">play_circle</span>
          <span className="text-base font-bold">見守りを開始</span>
        </span>
      </PrimaryButton>

      {/* 小さめのSOSボタン（セッション無しの場合は開始を促す） */}
      <div className="pt-4">
        <p className="text-xs text-warm-brown-600 mb-3 text-center">
          緊急時は下のボタンを長押ししてください
        </p>
        <LongPressButton
          onLongPress={onSos}
          ariaLabel="緊急SOS（長押し）"
          loading={sosLoading}
          disabled={sosLoading}
          className="w-full rounded-lg bg-danger hover:bg-red-600 text-white py-3 px-4 text-sm font-medium shadow-md shadow-danger/30 transition-colors focus:outline-none focus:ring-2 focus:ring-danger focus:ring-offset-2"
        >
          <span className="flex items-center justify-center gap-2">
            <span className="material-icons-outlined">warning</span>
            <span>緊急SOS（長押し）</span>
          </span>
        </LongPressButton>
      </div>
    </div>
  );
}
