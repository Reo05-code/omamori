/**
 * リダイレクト URL 検証ユーティリティ
 *
 * セキュリティ: オープンリダイレクト脆弱性を防止するため、
 * 内部パス（相対パス）のみを許可し、外部 URL を拒否します。
 */

/**
 * リダイレクトパスが安全な内部パスか検証
 *
 * @param path - 検証対象のパス
 * @returns 安全な内部パスの場合は true、それ以外は false
 *
 * @example
 * isValidRedirectPath('/dashboard') // true
 * isValidRedirectPath('/accept-invitation?token=xxx') // true
 * isValidRedirectPath('http://evil.com') // false
 * isValidRedirectPath('//evil.com') // false
 * isValidRedirectPath(null) // false
 */
export function isValidRedirectPath(path: string | null): boolean {
  if (!path) return false;

  // オープンリダイレクト脆弱性を防ぐため、http:// や https:// を含む URL は拒否
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('//')) {
    return false;
  }

  // スラッシュから始まる相対パスのみ許可
  return path.startsWith('/');
}
