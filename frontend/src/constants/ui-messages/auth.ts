/**
 * 認証メッセージ定数
 *
 * ログイン、新規登録、パスワードリセット、ログアウト関連のテキスト
 */

export const AUTH = {
  /**
   * ログアウト
   */
  LOGOUT: {
    HEADINGS: {
      TITLE: 'ログアウト',
    },
    BUTTONS: {
      DEFAULT: 'ログアウト',
      LOADING: 'ログアウト中...',
    },
    MESSAGES: {
      SUCCESS: 'ログアウトしました',
      RELOGIN_REQUIRED: 'ログアウトすると、再度ログインが必要になります。',
      DESCRIPTION: 'このアカウントからログアウトします。再度ログインが必要になります。',
    },
    MODAL: {
      TITLE: 'ログアウトしますか？',
      DESCRIPTION: 'ログアウトすると、再度ログインが必要になります。',
    },
  },

  /**
   * ログイン
   */
  LOGIN: {
    HEADINGS: {
      TITLE: 'Omamori',
      DESCRIPTION: 'アカウントにログインしてください',
    },
    BUTTONS: {
      SUBMIT: 'ログイン',
    },
    LINKS: {
      FORGOT_PASSWORD: 'パスワードを忘れた場合',
      NO_ACCOUNT: 'アカウントをお持ちでないですか？ ',
      REGISTER: '新規登録',
      SEPARATOR: 'または',
      TO_LOGIN: 'ログインへ',
      BACK_TO_LOGIN: 'ログイン画面に戻る',
    },
    MESSAGES: {
      AUTH_CHECK: '認証状態を確認中...',
      REDIRECTING: 'リダイレクト中...',
      LOGIN_REQUIRED: 'ログインしてください',
    },
  },

  /**
   * 新規登録
   */
  REGISTER: {
    HEADINGS: {
      TITLE: 'Omamoriユーザー登録',
      DESCRIPTION: '新しいアカウントを作成して、大切な人を見守りましょう。',
    },
    LABELS: {
      FULL_NAME: '氏名',
      PHONE: '電話番号（任意）',
      PASSWORD_CONFIRMATION: 'パスワード（確認）',
    },
    PLACEHOLDERS: {
      FULL_NAME: '山田 太郎',
      EMAIL: 'example@railstutorial.org',
      PHONE: '090-1234-5678',
      PASSWORD: '••••••••',
    },
    BUTTONS: {
      SUBMIT: '登録する',
    },
    LINKS: {
      HAVE_ACCOUNT: 'すでにアカウントをお持ちですか？',
      LOGIN: 'ログイン',
    },
    MESSAGES: {
      SUCCESS: '登録が完了しました。ログインしてください。',
    },
    ERRORS: {
      PASSWORD_MISMATCH: 'パスワードが一致しません。',
      INVALID_EMAIL: '有効なメールアドレスを入力してください。',
      INVALID_PHONE: '電話番号は10〜11桁の数字で入力してください。',
      WEAK_PASSWORD: 'パスワードは8文字以上で、英大文字・小文字・数字を含めてください。',
    },
  },

  /**
   * パスワードリセット
   */
  PASSWORD_RESET: {
    REQUEST: {
      HEADINGS: {
        TITLE: 'パスワードをリセット',
        DESCRIPTION: '登録済みのメールアドレスを入力して、再設定用のリンクを受け取ってください。',
        SUCCESS_TITLE: 'リセットメールを送信しました',
      },
      LABELS: {
        EMAIL: '登録メールアドレス',
      },
      BUTTONS: {
        SUBMIT: 'リセットメールを送信',
      },
      MESSAGES: {
        SUCCESS: '登録済みのメールアドレスに再設定リンクを送りました。メールを確認してください。',
      },
      ERRORS: {
        INVALID_EMAIL: '有効なメールアドレスを入力してください',
      },
    },
    RESET: {
      HEADINGS: {
        TITLE: 'パスワード再設定',
        DESCRIPTION: 'メールのリンクから来たら、新しいパスワードを入力してください。',
      },
      LABELS: {
        NEW_PASSWORD: '新しいパスワード',
        PASSWORD_CONFIRMATION: 'パスワードの確認',
      },
      BUTTONS: {
        SUBMIT: 'パスワードをリセット',
      },
      ERRORS: {
        INVALID_LINK: '無効なリセットリンクです',
      },
    },
  },

  /**
   * 認証共通
   */
  COMMON: {
    LABELS: {
      EMAIL: 'メールアドレス',
      PASSWORD: 'パスワード',
    },
    VALIDATION: {
      PASSWORD_RULE: '※ パスワードは8文字以上、英大文字・小文字、数字を含めてください。',
      PASSWORD_VALID: 'パスワード要件を満たしています',
      PASSWORD_INVALID: 'パスワードの要件を満たしていません',
      PASSWORD_MATCH: 'パスワードが一致しています',
      PASSWORD_MISMATCH: '確認パスワードと一致していません',
    },
    ERRORS: {
      VALIDATION_FAILED: '認証の確認に失敗しました',
      VALIDATION_FAILED_DETAIL: '認証の確認に失敗しました。時間をおいて再読み込みしてください。',
      VALIDATION_RETRY: '認証情報の反映に時間がかかっています。再度お試しください。',
      NETWORK: '通信エラーが発生しました',
    },
    BUTTONS: {
      RELOAD: '再読み込み',
    },
  },
} as const;
