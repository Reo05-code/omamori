'use client';

import React from 'react';
import PrimaryButton from '../ui/PrimaryButton';
import LongPressButton from '../ui/LongPressButton';
import StatusCard from './StatusCard';
import AppIcon from '../ui/AppIcon';
import type { RiskAssessmentLevel } from '../../lib/api/types';

type Props = {
  lastCheckInTime?: string | null;
  onCheckIn: () => void;
  onSos: () => void;
  onFinish: () => void;
  checkInLoading?: boolean;
  sosLoading?: boolean;
  riskLevel?: RiskAssessmentLevel | null;
  riskLoading?: boolean;
  undoSecondsLeft?: number;
  undoLoading?: boolean;
  onUndo?: () => void;
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
  riskLevel = 'caution',
  riskLoading = false,
  undoSecondsLeft = 0,
  undoLoading = false,
  onUndo,
}: Props) {
  const statusSubLabel = lastCheckInTime
    ? `最終確認：${lastCheckInTime}`
    : '元気タッチをお願いします';

  const normalizedRiskLevel: RiskAssessmentLevel = riskLevel ?? 'caution';

  const clampedUndoSecondsLeft = Math.max(0, undoSecondsLeft);
  const showUndo = clampedUndoSecondsLeft > 0 && typeof onUndo === 'function';
  const disableCheckIn = checkInLoading || riskLoading || showUndo;

  const checkInVariant = normalizedRiskLevel === 'danger' ? 'danger' : 'normal';
  const checkInIconName = checkInVariant === 'danger' ? 'warning' : 'check';
  const checkInIconBg = checkInVariant === 'danger' ? 'bg-danger/10' : 'bg-secondary/15';
  const checkInIconColor = checkInVariant === 'danger' ? 'text-danger' : 'text-secondary';
  const checkInRingClass =
    checkInVariant === 'danger'
      ? 'ring-danger/30 hover:ring-danger/50'
      : 'ring-secondary/30 hover:ring-secondary/50';

  return (
    <div className="space-y-5">
      <StatusCard
        title="現在のステータス"
        statusLabel="見守り中"
        statusSubLabel={statusSubLabel}
        isWorking={true}
      />

      {/* 元気タッチ（riskに応じて表示/操作を変更） */}
      {riskLoading ? (
        <LongPressButton
          onLongPress={onCheckIn}
          ariaLabel="元気タッチ（判定中）"
          holdMs={1400}
          loading={false}
          disabled={true}
          className="w-full rounded-full bg-warm-surface/80 backdrop-blur-sm shadow-soft ring-1 ring-secondary/30 aspect-square flex flex-col items-center justify-center text-center opacity-60 cursor-not-allowed select-none touch-none [-webkit-touch-callout:none]"
        >
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-secondary/15 flex items-center justify-center animate-pulse">
              <AppIcon name="refresh" className="text-secondary text-2xl" />
            </div>
            <div className="text-lg font-bold text-warm-brown-800">判定中...</div>
          </div>
        </LongPressButton>
      ) : normalizedRiskLevel === 'safe' ? (
        <div className="w-full rounded-3xl bg-white/80 backdrop-blur-sm shadow-soft ring-1 ring-green-400/30 px-6 py-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-green-100 text-green-800 px-4 py-2 text-sm font-bold">
            <span aria-hidden="true">🟢</span>
            <span>異常なし</span>
          </div>
        </div>
      ) : (
        <LongPressButton
          onLongPress={onCheckIn}
          ariaLabel="元気タッチ（長押し）"
          holdMs={1400}
          loading={checkInLoading}
          disabled={disableCheckIn}
          className={`w-full rounded-full bg-warm-surface/80 backdrop-blur-sm shadow-soft ring-1 ${checkInRingClass} aspect-square flex flex-col items-center justify-center text-center transition-all hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed`}
        >
          {checkInLoading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-secondary/15 flex items-center justify-center animate-pulse">
                <AppIcon name="refresh" className="text-secondary text-2xl" />
              </div>
              <div className="text-lg font-bold text-warm-brown-800">送信中...</div>
            </div>
          ) : (
            <>
              <div
                className={`w-12 h-12 rounded-full ${checkInIconBg} flex items-center justify-center mb-4`}
              >
                <AppIcon name={checkInIconName} className={`${checkInIconColor} text-2xl`} />
              </div>
              <div className="text-2xl font-extrabold text-warm-brown-800">元気タッチ</div>
              <div className="mt-2 text-sm text-warm-brown-600">長押しで安否を報告</div>
            </>
          )}
        </LongPressButton>
      )}

      {/* Undo（残り秒数がある場合のみ） */}
      {showUndo && (
        <div
          className="w-full rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-center justify-between gap-3"
          role="status"
          aria-live="polite"
        >
          <div className="text-sm text-amber-900">
            送信しました（残り{clampedUndoSecondsLeft}秒）
          </div>
          <button
            type="button"
            onClick={onUndo}
            disabled={undoLoading}
            className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-sm font-bold disabled:opacity-60 disabled:cursor-not-allowed"
            aria-label="元気タッチを取り消す"
          >
            {undoLoading ? '取り消し中...' : '取り消す'}
          </button>
        </div>
      )}

      {/* SOSボタン（長押し） */}
      <LongPressButton
        onLongPress={onSos}
        ariaLabel="緊急SOS（長押し）"
        loading={sosLoading}
        disabled={sosLoading}
        className="w-full rounded-lg bg-red-500/80 hover:bg-red-600 text-white py-4 px-4 text-base font-bold shadow-md shadow-red-500/20 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
      >
        <span className="flex items-center justify-center gap-2">
          <AppIcon name="warning" className="text-xl" />
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
            <AppIcon name="stop_circle" className="text-base" />
            <span>見守りを終了</span>
          </span>
        </PrimaryButton>
      </div>
    </div>
  );
}
