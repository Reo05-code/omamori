/**
 * 共通UIメッセージ定数
 *
 * アプリケーション全体で使用される汎用的なUIテキスト
 */

export const COMMON = {
  /**
   * ボタンテキスト
   */
  BUTTONS: {
    // 基本アクション
    SAVE: '保存',
    CANCEL: 'キャンセル',
    DELETE: '削除',
    EXECUTE: '実行',
    CONFIRM: '確認',
    SUBMIT: '送信',
    CLOSE: '閉じる',
    BACK: '戻る',
    NEXT: '次へ',
    RETRY: '再試行',

    // ローディング状態
    SAVING: '保存中...',
    DELETING: '削除中...',
    SUBMITTING: '送信中...',
    LOADING: '読み込み中...',
    PROCESSING: '処理中...',
  },

  /**
   * ステータステキスト
   */
  STATUS: {
    LOADING: '読み込み中...',
    PROCESSING: '処理中...',
    AUTHENTICATING: '認証状態を確認中...',
  },

  /**
   * バリデーションメッセージ
   * クライアントサイドのフォームバリデーション用
   * 静的メッセージと動的メッセージ（関数）の両パターンを実装
   */
  VALIDATION: {
    // 静的メッセージ
    REQUIRED: '入力してください',
    INVALID_FORMAT: '形式が正しくありません',
    INVALID_EMAIL: '有効なメールアドレスを入力してください',
    INVALID_PHONE: '電話番号は10〜11桁の数字で入力してください',
    PASSWORD_MISMATCH: 'パスワードが一致しません',

    // 動的メッセージ（関数パターン）
    REQUIRED_FIELD: (fieldName: string) => `${fieldName}を入力してください`,
    PASSWORD_TOO_SHORT: (minLength: number) => `パスワードは${minLength}文字以上で入力してください`,
    PASSWORD_WEAK: (requirements: string) => `パスワードは${requirements}を含めてください`,
    TOO_LONG: (fieldName: string, maxLength: number) =>
      `${fieldName}は${maxLength}文字以内で入力してください`,
  },

  FALLBACK_ERRORS: {
    // ネットワーク・システム
    NETWORK_ERROR: 'ネットワークエラーが発生しました。通信状況を確認してください',
    LOAD_FAILED: '読み込みに失敗しました。時間をおいて再度お試しください。',
    SAVE_FAILED: '保存に失敗しました',
    DELETE_FAILED: '削除に失敗しました',
    UPDATE_FAILED: '更新に失敗しました',

    // 権限
    FORBIDDEN: '権限がありません',
    LOGIN_REQUIRED: 'ログインしてください',
  },

  /**
   * 動的テキストの実装例
   *
   * 引数を取る関数パターンの実装例
   * 他のFeature（MEMBER, INVITATION等）でも同様のパターンを使用してください
   *
   * @example
   * import { COMMON } from '@/constants/ui-messages';
   * const message = COMMON.DYNAMIC_EXAMPLES.PAGINATION(1, 5, 100);
   * // => "全100件中 1-5件を表示"
   */
  DYNAMIC_EXAMPLES: {
    PAGINATION: (start: number, end: number, total: number) =>
      `全${total}件中 ${start}-${end}件を表示`,
    ITEMS_SELECTED: (count: number) => `${count}件選択中`,
    REMAINING_TIME: (seconds: number) => `${seconds}秒後に自動送信...`,
  },

  /**
   * アクセシビリティラベル（スクリーンリーダー用）
   */
  ARIA_LABELS: {
    CLOSE_NOTIFICATION: '通知を閉じる',
    OPEN_MENU: 'メニューを開く',
    CLOSE_MENU: 'メニューを閉じる',
    LOADING: '読み込み中',
  },
} as const;
