/**
 * 作業報告関連のUIメッセージ定数
 */

export const WORK_LOG = {
  PAGE: {
    TITLE: '作業報告',
    NO_LOGS: '作業報告がありません',
  },

  TABS: {
    BASIC_INFO: '基本情報',
    SAFETY_LOGS: '安全日誌',
    RISK_ASSESSMENTS: '危険予知',
  },

  BASIC_INFO: {
    TITLE: '基本情報',
    FIELDS: {
      DATE: '日付',
      WORKER: '作業員',
      START_TIME: '開始時刻',
      END_TIME: '終了時刻',
      LOCATION: '作業場所',
      WORK_CONTENT: '作業内容',
      NOTES: '備考',
    },
    MESSAGES: {
      SAVE_SUCCESS: '作業報告を保存しました',
      SAVE_ERROR: '作業報告の保存に失敗しました',
      LOAD_ERROR: '作業報告の読み込みに失敗しました',
    },
  },

  SAFETY_LOGS: {
    TITLE: '安全日誌',
    TABLE: {
      HEADERS: {
        TIME: '時刻',
        TYPE: '種別',
        CONTENT: '内容',
        REPORTER: '報告者',
        ACTIONS: '操作',
      },
    },
    FORM: {
      TYPE_LABEL: '種別',
      CONTENT_LABEL: '内容',
      CONTENT_PLACEHOLDER: '内容を入力してください',
      SUBMIT: '登録',
      CANCEL: 'キャンセル',
    },
    ACTIONS: {
      ADD_NEW: '新規登録',
      EDIT: '編集',
      DELETE: '削除',
    },
    MESSAGES: {
      CREATE_SUCCESS: '安全日誌を登録しました',
      CREATE_ERROR: '安全日誌の登録に失敗しました',
      UPDATE_SUCCESS: '安全日誌を更新しました',
      UPDATE_ERROR: '安全日誌の更新に失敗しました',
      DELETE_SUCCESS: '安全日誌を削除しました',
      DELETE_ERROR: '安全日誌の削除に失敗しました',
      LOAD_ERROR: '安全日誌の読み込みに失敗しました',
    },
    NO_LOGS: '安全日誌がありません',
  },

  RISK_ASSESSMENTS: {
    TITLE: '危険予知',
    TABLE: {
      HEADERS: {
        HAZARD: '危険要因',
        RISK: 'リスク',
        COUNTERMEASURE: '対策',
        RESPONSIBLE: '担当者',
        STATUS: '状態',
        ACTIONS: '操作',
      },
    },
    FORM: {
      HAZARD_LABEL: '危険要因',
      HAZARD_PLACEHOLDER: '危険要因を入力してください',
      RISK_LABEL: 'リスク',
      RISK_PLACEHOLDER: 'リスクを入力してください',
      COUNTERMEASURE_LABEL: '対策',
      COUNTERMEASURE_PLACEHOLDER: '対策を入力してください',
      RESPONSIBLE_LABEL: '担当者',
      STATUS_LABEL: '状態',
      SUBMIT: '登録',
      CANCEL: 'キャンセル',
    },
    ACTIONS: {
      ADD_NEW: '新規登録',
      EDIT: '編集',
      DELETE: '削除',
    },
    STATUS: {
      PENDING: '未対応',
      IN_PROGRESS: '対応中',
      COMPLETED: '完了',
    },
    MESSAGES: {
      CREATE_SUCCESS: '危険予知を登録しました',
      CREATE_ERROR: '危険予知の登録に失敗しました',
      UPDATE_SUCCESS: '危険予知を更新しました',
      UPDATE_ERROR: '危険予知の更新に失敗しました',
      DELETE_SUCCESS: '危険予知を削除しました',
      DELETE_ERROR: '危険予知の削除に失敗しました',
      LOAD_ERROR: '危険予知の読み込みに失敗しました',
    },
    NO_ASSESSMENTS: '危険予知がありません',
  },

  USER_SELECT: {
    LABEL: '作業員選択',
    PLACEHOLDER: '作業員を選択してください',
    ALL: 'すべて',
    SEARCH: '検索',
  },

  FILTERS: {
    DATE_RANGE: '期間',
    WORKER: '作業員',
    STATUS: '状態',
    CLEAR: 'クリア',
    APPLY: '適用',
  },

  STATUS: {
    LOADING: '読み込み中...',
    ERROR: 'エラーが発生しました',
  },
} as const;
