import { buildPaginationTokens } from '../paginationUtils';

describe('buildPaginationTokens', () => {
  it('中央: total=20, current=10 -> [1, ..., 9, 10, 11, ..., 20]', () => {
    expect(
      buildPaginationTokens({
        totalPages: 20,
        currentPage: 10,
        siblingCount: 1,
        boundaryCount: 1,
      }),
    ).toEqual([1, '...', 9, 10, 11, '...', 20]);
  });

  it('先頭寄り: total=20, current=2', () => {
    expect(
      buildPaginationTokens({
        totalPages: 20,
        currentPage: 2,
        siblingCount: 1,
        boundaryCount: 1,
      }),
    ).toEqual([1, 2, 3, 4, 5, '...', 20]);
  });

  it('末尾寄り: total=20, current=19', () => {
    expect(
      buildPaginationTokens({
        totalPages: 20,
        currentPage: 19,
        siblingCount: 1,
        boundaryCount: 1,
      }),
    ).toEqual([1, '...', 16, 17, 18, 19, 20]);
  });

  it('totalPagesが小さい場合は省略しない', () => {
    expect(
      buildPaginationTokens({
        totalPages: 5,
        currentPage: 3,
        siblingCount: 1,
        boundaryCount: 1,
      }),
    ).toEqual([1, 2, 3, 4, 5]);
  });
});
