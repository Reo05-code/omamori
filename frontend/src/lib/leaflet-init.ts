import L from 'leaflet';

/**
 * Leafletのデフォルトアイコン設定を初期化
 *
 * この関数は各地図コンポーネントのuseEffect内で呼び出すことで、
 * モジュールスコープでの副作用を避け、設定の競合を防ぐ
 */
let isInitialized = false;

export function initializeLeafletIcons(): void {
  // 既に初期化済みの場合はスキップ
  if (isInitialized) {
    return;
  }

  // Leafletのデフォルトアイコン取得メソッドを削除
  // @ts-expect-error - Leaflet internal property not in type definitions
  delete L.Icon.Default.prototype._getIconUrl;

  // CDNからアイコン画像を取得するように設定
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });

  isInitialized = true;
}
