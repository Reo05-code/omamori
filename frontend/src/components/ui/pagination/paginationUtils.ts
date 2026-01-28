export type PaginationToken = number | '...';

export type BuildPaginationTokensParams = {
  currentPage: number;
  totalPages: number;
  siblingCount?: number;
  boundaryCount?: number;
};

function toSafeInteger(value: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return Math.trunc(value);
}

export function clampPage(page: number, totalPages: number): number {
  const safeTotal = Math.max(1, toSafeInteger(totalPages));
  const safePage = toSafeInteger(page);
  return Math.min(Math.max(1, safePage), safeTotal);
}

function range(start: number, end: number): number[] {
  if (end < start) return [];
  const length = end - start + 1;
  return Array.from({ length }, (_, i) => start + i);
}

/**
 * 数字ページネーションの「表示トークン」を生成する（UI非依存）。
 *
 * 例: totalPages=20, currentPage=10, siblingCount=1, boundaryCount=1
 * -> [1, '...', 9, 10, 11, '...', 20]
 */
export function buildPaginationTokens({
  currentPage,
  totalPages,
  siblingCount = 1,
  boundaryCount = 1,
}: BuildPaginationTokensParams): PaginationToken[] {
  const safeTotal = Math.max(1, toSafeInteger(totalPages));
  const safeBoundary = Math.max(0, toSafeInteger(boundaryCount));
  const safeSibling = Math.max(0, toSafeInteger(siblingCount));

  const page = clampPage(currentPage, safeTotal);

  // totalPages が小さい場合は省略記号不要
  const maxVisible = safeBoundary * 2 + safeSibling * 2 + 1;
  if (safeTotal <= maxVisible) {
    return range(1, safeTotal);
  }

  // MUIのusePagination相当のロジック（境界+兄弟+省略記号）
  const startPages = range(1, Math.min(safeBoundary, safeTotal));
  const endPages = range(Math.max(safeTotal - safeBoundary + 1, safeBoundary + 1), safeTotal);

  const siblingsStart = Math.max(
    Math.min(page - safeSibling, safeTotal - safeBoundary - safeSibling * 2 - 1),
    safeBoundary + 2,
  );

  const siblingsEnd = Math.min(
    Math.max(page + safeSibling, safeBoundary + safeSibling * 2 + 2),
    endPages.length > 0 ? endPages[0] - 2 : safeTotal - 1,
  );

  const tokens: PaginationToken[] = [];

  tokens.push(...startPages);

  // start ellipsis
  if (siblingsStart > safeBoundary + 2) {
    tokens.push('...');
  } else if (safeBoundary + 1 < safeTotal - safeBoundary) {
    tokens.push(safeBoundary + 1);
  }

  tokens.push(...range(siblingsStart, siblingsEnd));

  // end ellipsis
  if (siblingsEnd < safeTotal - safeBoundary - 1) {
    tokens.push('...');
  } else if (safeTotal - safeBoundary > safeBoundary) {
    tokens.push(safeTotal - safeBoundary);
  }

  tokens.push(...endPages);

  // 重複除去（境界条件で同じ数が入り得るのを防ぐ）
  const deduped: PaginationToken[] = [];
  for (const t of tokens) {
    const last = deduped[deduped.length - 1];
    if (t === last) continue;
    deduped.push(t);
  }

  return deduped;
}
