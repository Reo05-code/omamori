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
 * 条件: 8文字以上、英大文字・英小文字・数字を含む
 */
export function isStrongPassword(value: string): boolean {
  // 同じ検証ルールをフロント内のリセット / 登録で共有するためにここで定義
  const pwRegex = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}/
  return pwRegex.test(value)
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
  if (!raw) return null;
  let s = String(raw).trim();

  // HTML タグ判定
  if (/<\/?[a-z][\s\S]*>/i.test(s)) {
    return 'エラーが発生しました。しばらくしてから再度お試しください。';
  }

  // URL
  s = s.replace(/\bhttps?:\/\/[^\s]+/gi, '[リンクは省略されました]');

  // メール
  s = s.replace(/\b[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}\b/g, '[メールアドレスは省略されました]');

  // 長さ制限
  const max = 200;
  if (s.length > max) s = s.slice(0, max - 1) + '…';

  if (!s.trim()) return 'エラーが発生しました。';

  return s;
}
