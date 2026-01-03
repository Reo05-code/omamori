'use client';

import React from 'react';
import PrimaryButton from '../ui/PrimaryButton';
import LongPressButton from '../ui/LongPressButton';
import StatusCard from './StatusCard';

type Props = {
  lastCheckInTime?: string | null;
  onCheckIn: () => void;
  onSos: () => void;
  onFinish: () => void;
  checkInLoading?: boolean;
  sosLoading?: boolean;
};

/**
 * 見守り中の画面
 * - ステータスカード（見守り中 + 最終確認時刻）
 * - 元気タッチ（大円ボタン）
 * - SOS（長押し、赤ボタン）
 * - 終了ボタン（小、右下）
 */
export default function MonitoringView({
  lastCheckInTime,
  onCheckIn,
  onSos,
  onFinish,
  checkInLoading = false,
  sosLoading = false,
}: Props) {
  const statusSubLabel = lastCheckInTime
    ? `最終確認：${lastCheckInTime}`
    : '元気タッチをお願いします';

  return (
    <div className="space-y-5">
      <StatusCard
        title="現在のステータス"
        statusLabel="見守り中"
        statusSubLabel={statusSubLabel}
        isWorking={true}
      />

      {/* 元気タッチ（大円ボタン） */}
      <button
        type="button"
        onClick={onCheckIn}
        disabled={checkInLoading}
        className="w-full rounded-full bg-warm-surface/80 backdrop-blur-sm shadow-soft ring-1 ring-secondary/30 aspect-square flex flex-col items-center justify-center text-center transition-all hover:ring-secondary/50 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
        aria-label="元気タッチ"
      >
        {checkInLoading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-secondary/15 flex items-center justify-center animate-pulse">
              <span className="material-icons-outlined text-secondary">refresh</span>
            </div>
            <div className="text-lg font-bold text-warm-brown-800">送信中...</div>
          </div>
        ) : (
          <>
            <div className="w-12 h-12 rounded-full bg-secondary/15 flex items-center justify-center mb-4">
              <span className="material-icons-outlined text-secondary">check</span>
            </div>
            <div className="text-2xl font-extrabold text-warm-brown-800">元気タッチ</div>
            <div className="mt-2 text-sm text-warm-brown-600">ここをタップして安否を報告</div>
          </>
        )}
      </button>

      {/* SOSボタン（長押し） */}
      <LongPressButton
        onLongPress={onSos}
        ariaLabel="緊急SOS（長押し）"
        loading={sosLoading}
        disabled={sosLoading}
        className="w-full rounded-lg bg-danger hover:bg-red-600 text-white py-4 px-4 text-base font-bold shadow-md shadow-danger/30 transition-colors focus:outline-none focus:ring-2 focus:ring-danger focus:ring-offset-2"
      >
        <span className="flex items-center justify-center gap-2">
          <span className="material-icons-outlined text-xl">warning</span>
          <span>緊急事態 / SOS（長押し）</span>
        </span>
      </LongPressButton>

      {/* 終了ボタン（小） */}
      <div className="flex justify-end pt-2">
        <PrimaryButton
          onClick={onFinish}
          className="w-auto bg-warm-brown-200 hover:bg-warm-brown-300 text-warm-brown-800 shadow-sm"
        >
          <span className="flex items-center gap-1.5 text-sm">
            <span className="material-icons-outlined text-base">stop_circle</span>
            <span>見守りを終了</span>
          </span>
        </PrimaryButton>
      </div>
    </div>
  );
}
