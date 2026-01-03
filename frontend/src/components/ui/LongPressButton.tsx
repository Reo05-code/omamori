'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Spinner from './Spinner';

type Props = {
  onLongPress: () => void;
  /** ボタンの中身（アイコンやテキスト） */
  children: React.ReactNode;
  /** 長押し判定とみなす時間（ミリ秒）。デフォルトは3000ms */
  holdMs?: number;
  /** 長押しが中断された時に呼ばれるコールバック */
  onCancel?: () => void;
  /** アクセシビリティ用のラベル（必須） */
  ariaLabel: string;
  /** 追加のスタイリング */
  className?: string;
  disabled?: boolean;
  loading?: boolean;
};

/**
 * LongPressButton
 *
 * @description
 * 誤操作を防ぐために、一定時間の長押し（ホールド）でのみアクションを発火させるボタンコンポーネント。
 * SOS送信や重要な設定変更など、不可逆または重大なアクションに使用します。
 *
 * @features
 * - Pointer Event API を使用し、マウス/タッチ/ペン操作を統一的に処理
 * - requestAnimationFrame による滑らかな進捗リングアニメーション
 * - スマホ特有の「長押しメニュー」や「テキスト選択」の防止
 * - スクリーンリーダー向けの進行状況通知 (aria-live)
 */
export default function LongPressButton({
  onLongPress,
  children,
  holdMs = 3000,
  onCancel,
  ariaLabel,
  className = '',
  disabled = false,
  loading = false,
}: Props) {
  // 進捗状況 (0 ~ 100)
  const [progress, setProgress] = useState(0);
  const [pressing, setPressing] = useState(false);

  // アニメーションフレームのID管理
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const isDisabled = disabled || loading;

  /**
   * タイマーとアニメーションをクリーンアップする関数
   */
  const clearAnimation = useCallback(() => {
    if (animationRef.current !== null) {
      window.cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, []);

  /**
   * キャンセル時の処理
   * ユーザーが指を離した、またはポインターが外れた場合に実行
   */
  const handleCancel = useCallback(() => {
    clearAnimation();
    if (pressing) {
      setPressing(false);
      setProgress(0);
      startTimeRef.current = null;
      onCancel?.();
    }
  }, [clearAnimation, onCancel, pressing]);

  /**
   * 完了時の処理
   * 指定時間（holdMs）を経過した時点で実行
   */
  const handleComplete = useCallback(() => {
    clearAnimation();
    setPressing(false);
    setProgress(100);
    startTimeRef.current = null;
    onLongPress();
  }, [clearAnimation, onLongPress]);

  /**
   * 進捗更新ループ
   * requestAnimationFrame により、モニターのリフレッシュレートに合わせて実行される
   */
  const updateProgress = useCallback(() => {
    if (startTimeRef.current === null) return;

    const elapsed = Date.now() - startTimeRef.current;
    // 進捗率を計算（上限100%）
    const newProgress = Math.min((elapsed / holdMs) * 100, 100);
    setProgress(newProgress);

    if (elapsed >= holdMs) {
      handleComplete();
    } else {
      // 次のフレームを予約
      animationRef.current = window.requestAnimationFrame(updateProgress);
    }
  }, [holdMs, handleComplete]);

  /**
   * 押下開始時の処理
   */
  const handleStart = useCallback(
    (e?: React.SyntheticEvent) => {
      // 右クリックや、無効化時は無視
      if (isDisabled || (e && 'button' in e && (e as React.PointerEvent).button !== 0)) {
        return;
      }

      setPressing(true);
      setProgress(0);
      startTimeRef.current = Date.now();
      animationRef.current = window.requestAnimationFrame(updateProgress);
    },
    [isDisabled, updateProgress],
  );

  /**
   * キーボード操作の開始 (Space / Enter)
   * キーリピートによる連続発火を防ぐため pressing チェックを入れる
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (isDisabled || pressing) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleStart();
      }
    },
    [isDisabled, pressing, handleStart],
  );

  /**
   * キーボード操作の終了
   */
  const handleKeyUp = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleCancel();
      }
    },
    [handleCancel],
  );

  // コンポーネントのアンマウント時に確実にタイマーを破棄
  useEffect(() => {
    return () => clearAnimation();
  }, [clearAnimation]);

  // SVG描画用の計算
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative inline-block">
      <button
        type="button"
        aria-label={ariaLabel}
        disabled={isDisabled}
        // UX対策:
        // touch-none: ブラウザのスクロールやズームを無効化
        // select-none: 長押し時のテキスト選択を防止
        className={`relative touch-none select-none outline-none ${className} disabled:opacity-60 disabled:cursor-not-allowed`}
        // イベント処理:
        // Pointer Events API に一本化することで、マウス・タッチ・ペンの競合を防ぐ
        onPointerDown={handleStart}
        onPointerUp={handleCancel}
        onPointerLeave={handleCancel}
        onPointerCancel={handleCancel} // 電話着信などで中断された場合
        // 右クリックメニュー（コンテキストメニュー）を抑止
        onContextMenu={(e) => e.preventDefault()}
        // キーボード対応
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
      >
        {/* ボタンの中身またはローディング表示 */}
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Spinner size="sm" className="text-white" />
            <span>送信中...</span>
          </span>
        ) : (
          children
        )}

        {/* 進捗リングアニメーション (押下中のみ表示) */}
        {pressing && !loading && (
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none transform -rotate-90"
            viewBox="0 0 120 120"
            aria-hidden="true"
          >
            {/* 背景の薄い円 */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="opacity-20"
            />
            {/* 進捗を示す円 */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="opacity-80 transition-all duration-75 ease-linear"
            />
          </svg>
        )}
      </button>

      {/* スクリーンリーダー向けの状態通知 (視覚的には非表示) */}
      <div className="sr-only" aria-live="polite">
        {pressing && !loading && 'ボタンを長押し中です...'}
        {loading && '処理を実行中です...'}
      </div>
    </div>
  );
}
