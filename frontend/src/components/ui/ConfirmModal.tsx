'use client';

import React, { useCallback, useEffect, useRef } from 'react';

type Props = {
  open: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmDanger?: boolean;
};

/**
 * 確認モーダル（終了/削除等の誤操作防止）
 * - フォーカストラップ
 * - ESC で閉じる
 * - 初期フォーカスは Cancel ボタン
 * - 背景クリックで閉じる
 */
export default function ConfirmModal({
  open,
  title,
  description,
  onConfirm,
  onCancel,
  confirmText = '実行',
  cancelText = 'キャンセル',
  confirmDanger = false,
}: Props) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);
  const confirmButtonRef = useRef<HTMLButtonElement | null>(null);

  // 意図しない実行を防ぐためモーダルオープン時に Cancel ボタンにフォーカス
  useEffect(() => {
    if (!open) return;
    cancelButtonRef.current?.focus();
  }, [open]);

  // 背景スクロール禁止 & ESC キー処理
  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onCancel]);

  // モーダルが開いている間はフォーカスをモーダル内に閉じ込める（Tab/Shift+Tab でモーダル内を循環）
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    const focusableElements = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );

    if (!focusableElements || focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey) {
      // Shift+Tab: 最初の要素なら最後へ
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab: 最後の要素なら最初へ
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  }, []);

  if (!open) return null;

  const confirmButtonClass = confirmDanger
    ? 'px-4 py-2 bg-danger hover:bg-red-600 text-white rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-danger focus:ring-offset-2'
    : 'px-4 py-2 bg-warm-orange hover:bg-warm-orange-light text-white rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-warm-orange focus:ring-offset-2';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      aria-modal="true"
      role="dialog"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-description"
      onKeyDown={handleKeyDown}
    >
      {/* 背景オーバーレイ */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* モーダル本体 */}
      <div
        ref={dialogRef}
        className="relative bg-warm-surface rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 z-10 border border-warm-brown-200/30"
      >
        <h3 id="confirm-modal-title" className="text-lg font-bold text-warm-brown-800 mb-2">
          {title}
        </h3>
        <p id="confirm-modal-description" className="text-sm text-warm-brown-600 mb-6">
          {description}
        </p>

        <div className="flex items-center justify-end gap-3">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-white border border-warm-brown-200 rounded-md text-sm font-medium text-warm-brown-700 hover:bg-warm-brown-50 transition-colors focus:outline-none focus:ring-2 focus:ring-warm-brown-300 focus:ring-offset-2"
          >
            {cancelText}
          </button>
          <button
            ref={confirmButtonRef}
            type="button"
            onClick={onConfirm}
            className={confirmButtonClass}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
