/**
 * 地図コンポーネント関連の定数
 * 設定値のみを管理（UIスタイルはコンポーネント側で制御）
 */

// 拠点の半径オプション（メートル単位）
export const RADIUS_OPTIONS = [50, 100, 200] as const;

// 半径の型（RADIUS_OPTIONSから自動生成）
export type RadiusOption = (typeof RADIUS_OPTIONS)[number];

// デフォルト半径
export const DEFAULT_RADIUS: RadiusOption = RADIUS_OPTIONS[0];

// 地図の基本設定
export const MAP_CONFIG = {
  DEFAULT_CENTER: [35.6812, 139.7671] as [number, number], // 東京駅
  DEFAULT_ZOOM: 15,
} as const;

// デザイン定数（Leaflet PathOptionsで使用する色のみ）
export const MAP_STYLES = {
  SELECTION_COLOR: '#ef4444', // Tailwind red-500
  SELECTION_FILL_OPACITY: 0.2,
} as const;

// 地図マーカーアイコンの設定（ローカルアセット参照）
export const MAP_ICONS = {
  RED_MARKER: '/images/map/marker-icon-red.png',
  BLUE_MARKER: '/images/map/marker-icon-blue.png',
  SHADOW: '/images/map/marker-shadow.png',
  SIZE: [25, 41] as [number, number],
  ANCHOR: [12, 41] as [number, number],
  POPUP_ANCHOR: [1, -34] as [number, number],
  SHADOW_SIZE: [41, 41] as [number, number],
} as const;
