/**
 * Worker アプリケーション設定
 */

export const WORKER_CONFIG = {
  /**
   * 元気タッチ取り消し可能時間（ミリ秒）
   * バックエンドの SafetyLog.undo_expires_at と同期すべき
   */
  UNDO_WINDOW_MS: 15000,

  /**
   * StartView でのセッション検知ポーリング間隔（ミリ秒）
   * 管理者が代行開始した場合の自動検知に使用
   */
  START_VIEW_POLL_INTERVAL_MS: 15000,

  /**
   * SOS送信時の位置情報取得タイムアウト（ミリ秒）
   * 緊急時は迅速な送信を優先するため短めに設定
   */
  SOS_LOCATION_TIMEOUT_MS: 4000,
} as const;
