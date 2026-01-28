/**
 * Dashboard関連のUIメッセージ定数
 */

export const DASHBOARD = {
  NAVIGATION: {
    ITEMS: {
      DASHBOARD: 'ダッシュボード',
      MEMBERS: 'メンバー一覧',
      ALERTS: 'アラート',
      WORK_LOGS: '作業ログ',
      SETTINGS: '設定',
    },
  },

  CARDS: {
    ACTIVE_WORKERS: {
      TITLE: '稼働中の作業員',
      UNIT: '人',
    },
    ALERTS: {
      TITLE: 'アラート',
      UNIT: '件',
    },
    RECENT_ALERTS: {
      TITLE: '最近のアラート',
      NO_ALERTS: 'アラートはありません',
      WORKER: '作業員',
      DETECTED_AT: '検知時刻',
      VIEW_ALL: 'すべて見る',
    },
    MAP: {
      TITLE: '作業員の位置',
      ERROR: '地図の読み込みに失敗しました',
      RETRY: '再試行',
    },
  },

  STATUS: {
    LOADING: '読み込み中...',
    ERROR: 'エラーが発生しました',
  },

  MEMBERS: {
    PAGE_TITLE: 'メンバー一覧',
    TABLE: {
      HEADERS: {
        NAME: '氏名',
        EMAIL: 'メールアドレス',
        ROLE: '権限',
        STATUS: '状態',
        ACTIONS: '操作',
      },
    },
    STATUS: {
      ACTIVE: '有効',
      DISABLED: '無効',
    },
    ACTIONS: {
      EDIT: '編集',
      DELETE: '削除',
      RESEND_INVITATION: '招待を再送',
      TOGGLE_REMOTE: 'リモート監視',
    },
    DIALOGS: {
      DELETE: {
        TITLE: 'メンバーを削除',
        MESSAGE: (name: string) => `${name}を削除してもよろしいですか?`,
        CONFIRM: '削除',
        CANCEL: 'キャンセル',
      },
      TOGGLE_REMOTE: {
        TITLE: 'リモート監視設定',
        ENABLE_MESSAGE: (name: string) => `${name}のリモート監視を有効にしますか?`,
        DISABLE_MESSAGE: (name: string) => `${name}のリモート監視を無効にしますか?`,
        CONFIRM: '変更',
        CANCEL: 'キャンセル',
      },
    },
    MESSAGES: {
      DELETE_SUCCESS: 'メンバーを削除しました',
      DELETE_ERROR: 'メンバーの削除に失敗しました',
      TOGGLE_REMOTE_SUCCESS: 'リモート監視設定を変更しました',
      TOGGLE_REMOTE_ERROR: 'リモート監視設定の変更に失敗しました',
      RESEND_INVITATION_SUCCESS: '招待メールを再送しました',
      RESEND_INVITATION_ERROR: '招待メールの再送に失敗しました',
    },
  },

  SETTINGS: {
    PAGE_TITLE: '組織設定',
    SECTIONS: {
      GENERAL: {
        TITLE: '基本情報',
        ORGANIZATION_NAME: '組織名',
        UPDATE_BUTTON: '更新',
      },
      DANGER_ZONE: {
        TITLE: '危険な操作',
        DELETE_ORGANIZATION: '組織を削除',
        DELETE_WARNING: 'この操作は取り消せません。組織に関連するすべてのデータが削除されます。',
      },
    },
    MESSAGES: {
      UPDATE_SUCCESS: '組織情報を更新しました',
      UPDATE_ERROR: '組織情報の更新に失敗しました',
    },
  },

  MAP: {
    NO_WORKERS: '作業員の位置情報がありません',
    LOADING: '位置情報を読み込んでいます...',
    ERROR: '位置情報の取得に失敗しました',
  },
} as const;
