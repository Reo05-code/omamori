import { useMemo } from 'react';

import { buildPaginationTokens, clampPage, type PaginationToken } from './paginationUtils';

export type PaginationItem =
  | {
      type: 'page';
      page: number;
      isCurrent: boolean;
    }
  | {
      type: 'ellipsis';
      key: string;
    };

export type UsePaginationParams = {
  currentPage: number;
  totalPages: number;
  siblingCount?: number;
  boundaryCount?: number;
};

export function usePagination({
  currentPage,
  totalPages,
  siblingCount = 1,
  boundaryCount = 1,
}: UsePaginationParams): { currentPage: number; items: PaginationItem[] } {
  const safeTotalPages = useMemo(() => {
    if (typeof totalPages !== 'number' || !Number.isFinite(totalPages)) return 1;
    return Math.max(1, Math.trunc(totalPages));
  }, [totalPages]);

  const safeCurrentPage = useMemo(
    () => clampPage(currentPage, safeTotalPages),
    [currentPage, safeTotalPages],
  );

  const tokens: PaginationToken[] = useMemo(
    () =>
      buildPaginationTokens({
        currentPage: safeCurrentPage,
        totalPages: safeTotalPages,
        siblingCount,
        boundaryCount,
      }),
    [safeCurrentPage, safeTotalPages, siblingCount, boundaryCount],
  );

  const items = useMemo(() => {
    let ellipsisIndex = 0;

    return tokens.map((t) => {
      if (t === '...') {
        ellipsisIndex += 1;
        return { type: 'ellipsis', key: `ellipsis-${ellipsisIndex}` } as const;
      }

      return {
        type: 'page',
        page: t,
        isCurrent: t === safeCurrentPage,
      } as const;
    });
  }, [tokens, safeCurrentPage]);

  return { currentPage: safeCurrentPage, items };
}
