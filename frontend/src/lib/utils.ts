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
