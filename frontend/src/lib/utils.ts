/**
 * バリデーション関数を集約
 */

/**
 * メールアドレスの形式を検証
 */
export function isEmail(value: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
}

/**
 * パスワードの強度を検証
 * 条件: 6文字以上
 */
export function isStrongPassword(value: string): boolean {
  return value.length >= 6; // Devise のデフォルト要件に準拠
}

/**
 * 必須フィールドの検証
 */
export function isRequired(value: string): boolean {
  return value.trim().length > 0;
}

/**
 * 電話番号の形式を検証
 * 条件: 10～11桁の数字
 */
export function isPhoneNumber(value: string): boolean {
  const phoneRegex = /^\d{10,11}$/;
  return phoneRegex.test(value);
}

/**
 * サニタイズされたユーザー向けエラーメッセージを生成する
 * - 長すぎるメッセージは切り詰める
 * - URL / ファイルパス / メールアドレスなどの機微情報は置換する
 * - HTML タグが含まれる場合は一般的な汎用メッセージにフォールバックする
 */
export function sanitizeErrorMessage(raw?: string | null): string | null {
  if (!raw) return null
  let s = String(raw).trim()

  // HTML タグが含まれる場合は漏洩防止のため汎用メッセージにする
  if (/[<>]/.test(s)) {
    return 'エラーが発生しました。しばらくしてから再度お試しください。'
  }

  // URL を省略
  s = s.replace(/https?:\/\/[^\s]+/g, '[リンクは省略されました]')

  // メールアドレスを省略
  s = s.replace(/\b[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}\b/g, '[メールアドレスは省略されました]')

  // UNIX/Windows のファイルパスっぽいものを省略
  s = s.replace(/(?:[A-Za-z]:)?\/(?:(?:[^\s\/]+)\/)*[^\s\/]+/g, '[パスは省略されました]')

  // 過度に長いものは切り詰め
  const max = 200
  if (s.length > max) s = s.slice(0, max - 1) + '…'

  return s || 'エラーが発生しました。'
}
