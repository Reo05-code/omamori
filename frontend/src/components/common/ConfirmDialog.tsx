'use client';

import React, { useEffect, useRef } from 'react';
import { COMMON } from '@/constants/ui-messages';

type Props = {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = COMMON.BUTTONS.CONFIRM,
  cancelLabel = COMMON.BUTTONS.CANCEL,
  onConfirm,
  onCancel,
}: Props) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const confirmButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    confirmButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel();
        return;
      }

      if (event.key !== 'Tab') return;

      const elements = dialogRef.current
        ? (Array.from(dialogRef.current.querySelectorAll(FOCUSABLE_SELECTOR)) as HTMLElement[])
        : [];
      if (elements.length === 0) return;

      const first = elements[0];
      const last = elements[elements.length - 1];

      if (event.shiftKey) {
        if (document.activeElement === first) {
          event.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="fixed inset-0 bg-black/50" onClick={onCancel} aria-hidden="true" />
      <div
        ref={dialogRef}
        className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 p-6 z-10"
      >
        <h3
          id="confirm-dialog-title"
          className="text-lg font-medium text-gray-900 dark:text-white mb-2"
        >
          {title}
        </h3>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 whitespace-pre-line break-words mb-4">
          {message}
        </p>
        <div className="flex items-center justify-end space-x-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-white border border-gray-200 rounded-md text-sm text-gray-700 hover:bg-gray-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            ref={confirmButtonRef}
            onClick={onConfirm}
            className="px-4 py-2 bg-primary text-white rounded-md text-sm"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
