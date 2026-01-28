/**
 * シンプルな数字のみのページネーションコンポーネント
 *
 * セキュリティ考慮事項:
 * - ページ番号は数値バリデーション済み（XSS対策）
 * - disabled状態で二重送信を防止
 * - ARIA属性でアクセシビリティ確保
 *
 * パフォーマンス考慮事項:
 * - useCallback でイベントハンドラーをメモ化
 * - 不要な再レンダリングを防止
 */

'use client';

import { useCallback, useMemo } from 'react';

import { usePagination } from './pagination/usePagination';

export type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** 表示する最大ページ番号数（デフォルト: 7） */
  maxVisible?: number;
  loading?: boolean;
};

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  maxVisible = 7,
  loading = false,
}: PaginationProps) {
  // maxVisible（表示最大数）から siblingCount を導出
  // 目安: boundaryCount=1 のとき最大表示は 5 + 2*siblingCount
  const siblingCount = useMemo(() => {
    if (typeof maxVisible !== 'number' || !Number.isFinite(maxVisible)) return 1;
    const safe = Math.max(5, Math.trunc(maxVisible));
    return Math.max(0, Math.floor((safe - 5) / 2));
  }, [maxVisible]);

  const { currentPage: validatedCurrentPage, items } = usePagination({
    currentPage,
    totalPages,
    siblingCount,
    boundaryCount: 1,
  });

  // ========== イベントハンドラー ==========
  const handlePageClick = useCallback(
    (page: number) => {
      // セキュリティ: ページ番号のバリデーション
      if (typeof page !== 'number' || !Number.isFinite(page) || page < 1) {
        return;
      }
      if (totalPages !== null && page > totalPages) {
        return;
      }
      if (page === validatedCurrentPage || loading) {
        return; // 同じページへの遷移またはローディング中は無視
      }
      onPageChange(page);
    },
    [onPageChange, totalPages, validatedCurrentPage, loading],
  );

  // ========== レンダリング ==========
  // ページ数が1以下の場合は何も表示しない
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav
      className="flex items-center justify-center gap-2"
      role="navigation"
      aria-label="ページネーション"
    >
      {items.map((item) => {
        if (item.type === 'ellipsis') {
          return (
            <span
              key={item.key}
              className="px-1 text-sm text-gray-500 dark:text-gray-400"
              aria-hidden="true"
            >
              …
            </span>
          );
        }

        const page = item.page;

        if (item.isCurrent) {
          // 現在のページはspanとして表示（クリック不可、常に見える）
          return (
            <span
              key={page}
              className="min-w-[2rem] h-8 px-2 text-sm font-medium rounded transition-colors flex items-center justify-center bg-warm-orange text-white cursor-default hover:bg-warm-orange-light"
              aria-label={`現在のページ ${page}`}
              aria-current="page"
            >
              {page}
            </span>
          );
        }

        return (
          <button
            key={page}
            type="button"
            onClick={() => handlePageClick(page)}
            disabled={loading}
            className={`
              min-w-[2rem] h-8 px-2 text-sm font-medium rounded transition-colors
              focus:outline-none focus:ring-2 focus:ring-warm-orange focus:ring-offset-1
              dark:focus:ring-offset-gray-900
              text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700
              ${loading ? 'opacity-50 cursor-wait' : ''}
            `}
            aria-label={`ページ ${page} へ`}
          >
            {page}
          </button>
        );
      })}
    </nav>
  );
}
