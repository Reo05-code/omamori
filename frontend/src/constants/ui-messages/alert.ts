/**
 * アラート関連のUIメッセージ定数
 */

export const ALERT = {
  PAGE: {
    TITLE: 'アラート一覧',
    NO_ALERTS: 'アラートはありません。',
  },

  TABLE: {
    HEADERS: {
      TYPE: '種別',
      WORKER: '作業員',
      DETECTED_AT: '検知時刻',
      DETAILS: '詳細',
    },
  },

  FILTERS: {
    ALL: 'すべて',
    UNREAD: '未読のみ',
    TYPE_LABEL: '種別で絞り込み',
    WORKER_LABEL: '作業員で絞り込み',
    DATE_RANGE: '期間',
    CLEAR: 'クリア',
    APPLY: '適用',
  },

  WIDGET: {
    TITLE: '最近のアラート',
    VIEW_ALL: 'すべて見る',
    NO_ALERTS: 'アラートはありません',
    LOADING: '読み込み中...',
    ERROR: 'アラートの読み込みに失敗しました',
  },

  DETAILS: {
    LOCATION: '位置情報',
    TIMESTAMP: '検知時刻',
    WORKER: '作業員',
    TYPE: '種別',
    STATUS: 'ステータス',
    NOTES: 'メモ',
    MAP: '地図で見る',
    CLOSE: '閉じる',
  },

  ACTIONS: {
    MARK_AS_READ: '既読にする',
    MARK_AS_UNREAD: '未読にする',
    DELETE: '削除',
  },

  MESSAGES: {
    MARK_AS_READ_SUCCESS: 'アラートを既読にしました',
    MARK_AS_READ_ERROR: 'アラートを既読にできませんでした',
    DELETE_SUCCESS: 'アラートを削除しました',
    DELETE_ERROR: 'アラートの削除に失敗しました',
    LOAD_ERROR: 'アラートの読み込みに失敗しました',
    ACCESS_DENIED: '権限がありません',
  },

  STATUS: {
    LOADING: '読み込み中...',
    ERROR: 'エラーが発生しました',
  },
} as const;
