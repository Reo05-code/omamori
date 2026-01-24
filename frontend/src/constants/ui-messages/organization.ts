/**
 * 組織・メンバー・招待関連のUIメッセージ定数
 */

// ========================================
// 組織 (ORGANIZATION)
// ========================================

export const ORGANIZATION = {
  HEADINGS: {
    CREATE: '組織を作成',
    SETTINGS: '組織設定',
    BASIC_INFO: '基本情報',
    BACK_TO_DASHBOARD: '組織ダッシュボードへ戻る',
    BACK_TO_TOP: '組織トップへ戻る',
  },

  LABELS: {
    NAME: '組織名',
    ID: '組織ID',
  },

  PLACEHOLDERS: {
    NAME: '会社名、チーム名など',
    NAME_EXAMPLE: '例: 株式会社テック',
  },

  BUTTONS: {
    CREATE: '作成する',
    CREATING: '作成中...',
  },

  MESSAGES: {
    STATIC: {
      CREATE_PROMPT: 'まずは組織を作成して始めましょう。',
      LOADING: '読み込み中です...',
      NOT_FOUND: '組織情報が見つかりません',
    },

    DYNAMIC: {
      NAME_UPDATED: () => '組織名を更新しました',
      CREATED: () => '組織を作成しました',
      UPDATED: () => '組織情報を更新しました',
    },
  },

  ERRORS: {
    NAME_REQUIRED: '組織名は必須です',
    NAME_TOO_LONG: '組織名は100文字以内で入力してください',
    LOAD_FAILED: '読み込みに失敗しました',
    LOAD_FAILED_RETRY: '読み込みに失敗しました。時間をおいて再度お試しください。',
    CREATE_FAILED: '組織の作成に失敗しました',
    UPDATE_FAILED: '組織の更新に失敗しました',
    FETCH_FAILED: '組織情報の取得に失敗しました',
    REFETCH_FAILED: '組織情報の再取得に失敗しました',
  },
} as const;

// ========================================
// メンバー (MEMBER)
// ========================================

export const MEMBER = {
  HEADINGS: {
    LIST: 'メンバー一覧',
    MANAGEMENT: 'メンバー管理',
    ACTIVE_MEMBERS: '稼働中メンバー',
    SELECT_TARGET_USER: '対象ユーザーを選択',
  },

  LABELS: {
    NAME: '名前',
    EMAIL: 'メールアドレス',
    ROLE: '権限',
    STATUS: 'ステータス',
    ACTIONS: '操作',
    WORK_LOGS: '作業ログ',
    NO_NAME: '（名前なし）',
  },

  MESSAGES: {
    STATIC: {
      LOADING: '読み込み中です...',
      NO_MEMBERS: 'メンバーがいません',
      NOT_FOUND: 'メンバーが見つかりません',
      OPERATION_DELAY_NOTICE: '操作結果の反映に数秒かかる場合があります',
    },

    DYNAMIC: {
      DELETED: () => 'メンバーを削除しました',
      ROLE_UPDATED: () => '権限を更新しました',
      LAST_ADMIN_CONSTRAINT: () => '最後の管理者は削除または権限変更できません',
      SELF_DELETE: () => '自分自身は削除できません',
      DELETE_FAILED: (message?: string) => message || '削除に失敗しました',
      ROLE_UPDATE_FAILED: (message?: string) => message || '権限の更新に失敗しました',
      MONITORING_STARTED: (name: string) => `${name}の見守りを開始しました`,
      MONITORING_FINISHED: (name: string) => `${name}の見守りを終了しました`,
    },
  },

  MODAL: {
    DELETE: {
      TITLE: 'メンバーを削除しますか？',
      DESCRIPTION: (name: string) => `${name} を組織から削除します。この操作は取り消せません。`,
      CONFIRM_TEXT: '削除する',
    },

    REMOTE_TOGGLE: {
      START_TITLE: '見守りを開始しますか？',
      FINISH_TITLE: '見守りを終了しますか？',
      START_CONFIRM: '見守りを開始する',
      FINISH_CONFIRM: '見守りを終了する',
      STARTING: '開始中...',
      FINISHING: '終了中...',
      ARIA_LABEL: (name: string, isActive: boolean) =>
        `${name}の見守りを${isActive ? '終了' : '開始'}`,
      START_SUCCESS: '見守りを開始しました',
      FINISH_SUCCESS: '見守りを終了しました',
      START_FAILED: '開始に失敗しました。時間をおいて再度お試しください。',
      FINISH_FAILED: '終了に失敗しました。時間をおいて再度お試しください。',
    },
  },

  ERRORS: {
    LOAD_FAILED: '読み込みに失敗しました',
    FETCH_FAILED: '取得に失敗しました',
    REFETCH_FAILED: '再取得に失敗しました',
    LOAD_FAILED_RETRY: '読み込みに失敗しました。時間をおいて再度お試しください。',
    LAST_ADMIN_CONSTRAINT: () => '最後の管理者は削除または権限変更できません',
    SELF_DELETE: () => '自分自身は削除できません',
    DELETE_FAILED: () => '削除に失敗しました',
    ROLE_UPDATE_FAILED: () => '権限の更新に失敗しました',
  },

  BUTTONS: {
    DELETE: '削除',
  },
} as const;

// ========================================
// 招待 (INVITATION)
// ========================================

export const INVITATION = {
  HEADINGS: {
    TITLE: '招待',
    PENDING_INVITATIONS: '招待中のユーザー',
    INVITE_MEMBER: 'メンバーを招待',
  },

  LABELS: {
    EMAIL: 'メールアドレス',
    ROLE: 'ロール',
    INVITED_AT: '招待日時',
  },

  PLACEHOLDERS: {
    EMAIL: 'example@example.com',
  },

  BUTTONS: {
    NEW_INVITATION: '新規招待',
    SEND: '招待を送信',
    SENDING: '送信中...',
    DELETE: '削除',
    DELETING: '削除中...',
  },

  MESSAGES: {
    STATIC: {
      LOADING: '読み込み中です...',
      NO_PENDING: '保留中の招待はありません',
    },

    DYNAMIC: {
      SENT: () => '招待メールを送信しました',
      DELETED: () => '招待を削除しました',
      DELETE_FAILED: (message?: string) => message || '削除に失敗しました',
    },
  },

  ERRORS: {
    EMAIL_REQUIRED: 'メールアドレスは必須です',
    EMAIL_INVALID: '有効なメールアドレスを入力してください',
    ALREADY_MEMBER: 'このメールアドレスは既にメンバーです',
    ALREADY_INVITED: 'このメールアドレスは既に招待済みです',
    SEND_FAILED: '招待の送信に失敗しました',
    DELETE_FAILED: '招待の削除に失敗しました',
    LOAD_FAILED: '招待の読み込みに失敗しました',
    PERMISSION_DENIED: '招待を送信する権限がありません',
  },

  MODAL: {
    DELETE: {
      TITLE: '招待を削除しますか？',
      DESCRIPTION: (email: string) => `${email} への招待を削除します。`,
      CONFIRM_TEXT: '削除する',
    },
  },
} as const;
