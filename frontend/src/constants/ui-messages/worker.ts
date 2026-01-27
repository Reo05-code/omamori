/**
 * Worker（見守り対象者）向け機能のUIメッセージ定数
 *
 * 見守り開始/終了、元気タッチ、SOS発信に関連するメッセージを一元管理
 */

export const WORKER = {
  // ========================================
  // 見守り機能（MONITORING）
  // ========================================
  MONITORING: {
    HEADINGS: {
      START_TITLE: '見守りを開始しましょう',
    },

    LABELS: {
      ACTIVE: '見守り中',
      START: '見守りを開始',
      FINISH: '見守りを終了',
    },

    MESSAGES: {
      START_SUCCESS: '見守りを開始しました',
      FINISH_SUCCESS: '見守りを終了しました',
      ALREADY_FINISHED: '作業セッションは既に終了されています',
      DESCRIPTION: '作業を開始すると、定期的な安否確認と緊急時のSOS発信ができるようになります。',
      LOCATION_TRACKING: '管理者が位置情報を確認',
    },

    ERRORS: {
      ORG_ID_MISSING: '組織IDが取得できませんでした',
    },

    MODAL: {
      FINISH_TITLE: '見守りを終了しますか？',
      FINISH_DESCRIPTION: '終了すると、元気タッチやSOS発信ができなくなります。',
    },
  },

  // ========================================
  // 元気タッチ機能（CHECK_IN）
  // ========================================
  CHECK_IN: {
    LABELS: {
      BUTTON: '元気タッチ',
      INSTRUCTION: '長押しで安否を報告',
      PERIODIC: '元気タッチで定期的に安否を報告',
      UNDO: '取り消す',
    },

    MESSAGES: {
      SUCCESS: '安否を報告しました',
      UNDO_SUCCESS: '元気タッチを取り消しました',
      REQUEST: '元気タッチをお願いします',
      NOT_NEEDED: '現在は元気タッチの送信は不要です',
      WAIT_UNDO: '直前の送信を取り消すか、時間切れを待ってください',
      RISK_LOADING: 'リスク判定中です。少し待ってください',
      SENT_WITH_COUNTDOWN: (seconds: number) => `送信しました（残り${seconds}秒）`,
    },

    LOADING: {
      SENDING: '送信中...',
      UNDOING: '取り消し中...',
      JUDGING: '判定中...',
    },

    ERRORS: {
      LOCATION_FAILED: '位置情報の取得に失敗しました。設定を確認してください',
      UNDO_FAILED: '取り消しに失敗しました',
    },

    ARIA: {
      LONG_PRESS: '元気タッチ（長押し）',
      JUDGING: '元気タッチ（判定中）',
      UNDO: '元気タッチを取り消す',
    },
  },

  // ========================================
  // SOS機能（SOS）
  // ========================================
  SOS: {
    LABELS: {
      BUTTON: '緊急事態 / SOS（長押し）',
      FEATURE: '緊急時は長押しでSOS発信',
    },

    MESSAGES: {
      SUCCESS: 'SOSを送信しました。安全な場所で待機してください',
      DUPLICATE: 'SOSは送信済みです。安全な場所で待機してください',
      NEED_SESSION: '見守りを開始してからSOSを送信してください',
    },

    ARIA: {
      LONG_PRESS: '緊急SOS（長押し）',
    },
  },

  // ========================================
  // ステータス表示（STATUS）
  // ========================================
  STATUS: {
    LABELS: {
      CURRENT_STATUS: '現在のステータス',
      SAFE: '異常なし',
    },

    MESSAGES: {
      LAST_CHECK: (time: string) => `最終確認：${time}`,
    },
  },

  // ========================================
  // 設定画面（SETTINGS）
  // ========================================
  SETTINGS: {
    HEADINGS: {
      TITLE: '設定',
      DESCRIPTION: 'アカウントの設定を管理します',
      ACCOUNT_MANAGEMENT: 'アカウント管理',
      HOME_LOCATION: '拠点設定',
      HOME_LOCATION_ITEM: '自宅・作業拠点',
    },

    LABELS: {
      LOCATION_TITLE: '拠点を設定しましょう',
      LOCATION_DESCRIPTION:
        '自宅や主要な作業拠点を地図から選択してください。拠点内での位置情報送信は安全と判定されます。',
      LOCATION_RANGE: '拠点の範囲',
      RADIUS_LABEL: (radius: number) => `${radius}m`,
    },

    MESSAGES: {
      HOME_LOCATION_SET: '設定済み',
      HOME_LOCATION_NOT_SET: '拠点が設定されていません。誤検知を防ぐために設定してください。',
      HOME_LOCATION_UPDATED: '拠点を更新しました',
      HOME_LOCATION_SUCCESS: '拠点を設定しました',
      VALIDATION_ERROR: '無効な座標です。有効な範囲で選択してください。',
      COORDINATE_REQUIRED: '地図から拠点を選択してください',
      LOCATION_UPDATE_FAILED: '設定に失敗しました。もう一度お試しください。',
    },

    BUTTONS: {
      SET_HOME_LOCATION: '拠点を設定する',
      CHANGE_HOME_LOCATION: '変更する',
      SET: '設定する',
      SKIP_FOR_NOW: 'あとで設定',
    },
  },

  // ========================================
  // ナビゲーション（NAVIGATION）
  // ========================================
  NAVIGATION: {
    HOME: 'ホーム',
    SETTINGS: '設定',
    HELP: 'ヘルプ',
    BACK_TO_HOME: 'ホームに戻る',
  },

  // ========================================
  // 共通（COMMON）
  // ========================================
  COMMON: {
    APP_NAME: 'オマモリ',
  },
} as const;
