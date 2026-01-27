'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MAP_CONFIG, MAP_ICONS } from '@/constants/map';
import { initializeLeafletIcons } from '@/lib/leaflet-init';

// 位置情報用の青いマーカーアイコン
const locationIcon = new L.Icon({
  iconUrl: MAP_ICONS.BLUE_MARKER,
  shadowUrl: MAP_ICONS.SHADOW,
  iconSize: MAP_ICONS.SIZE,
  iconAnchor: MAP_ICONS.ANCHOR,
  popupAnchor: MAP_ICONS.POPUP_ANCHOR,
  shadowSize: MAP_ICONS.SHADOW_SIZE,
});

type MapViewModalProps = {
  onClose: () => void;
  latitude: number;
  longitude: number;
  title?: string;
};

/**
 * 座標の妥当性を検証
 * 緯度: -90 ~ 90, 経度: -180 ~ 180
 */
function isValidCoordinate(lat: number, lon: number): boolean {
  return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

/**
 * 移動履歴の位置情報を地図上で表示するモーダルコンポーネント
 * Leaflet を使用して指定された座標にマーカーを表示
 * SSR では動作しないため、dynamic import で使用する
 */
export function MapViewModal({ onClose, latitude, longitude, title }: MapViewModalProps) {
  // 座標バリデーション
  const isValid = isValidCoordinate(latitude, longitude);

  // Leafletアイコン初期化
  useEffect(() => {
    initializeLeafletIcons();
  }, []);

  // 不正な座標の場合は警告ログ（開発環境のみ）
  useEffect(() => {
    if (!isValid) {
      console.warn(`Invalid coordinates: lat=${latitude}, lon=${longitude}`);
    }
  }, [isValid, latitude, longitude]);

  // ESCキーでモーダルを閉じる、スクロール無効化
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    // モーダル表示中はスクロールを無効化
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  // 不正な座標の場合はエラー表示
  if (!isValid) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="map-view-modal-title"
      >
        <div
          className="relative w-full max-w-md mx-4 bg-white dark:bg-warm-gray-800 rounded-lg shadow-2xl p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <h3
            id="map-view-modal-title"
            className="text-lg font-semibold text-warm-gray-900 dark:text-warm-gray-100 mb-4"
          >
            エラー
          </h3>
          <p className="text-red-600 dark:text-red-400 mb-4">
            無効な位置情報です。座標が範囲外です。
          </p>
          <p className="text-sm text-warm-gray-600 dark:text-warm-gray-400 mb-4">
            緯度: {latitude}, 経度: {longitude}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 rounded-md transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="map-view-modal-title"
    >
      <div
        className="relative w-full max-w-4xl mx-4 bg-white dark:bg-warm-gray-800 rounded-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-warm-gray-200 dark:border-warm-gray-700">
          <h3
            id="map-view-modal-title"
            className="text-lg font-semibold text-warm-gray-900 dark:text-warm-gray-100"
          >
            {title || '位置情報'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-warm-gray-400 hover:text-warm-gray-600 dark:hover:text-warm-gray-200 transition-colors"
            aria-label="閉じる"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* 座標表示 */}
        <div className="px-6 py-3 bg-warm-gray-50 dark:bg-warm-gray-900/30 border-b border-warm-gray-200 dark:border-warm-gray-700">
          <p className="text-sm text-warm-gray-600 dark:text-warm-gray-400">
            緯度: {latitude.toFixed(6)}, 経度: {longitude.toFixed(6)}
          </p>
        </div>

        {/* 地図表示 */}
        <div className="w-full h-[500px]">
          <MapContainer
            center={[latitude, longitude]}
            zoom={MAP_CONFIG.DEFAULT_ZOOM}
            style={{ width: '100%', height: '100%' }}
            className="z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />
            <Marker position={[latitude, longitude]} icon={locationIcon} />
          </MapContainer>
        </div>

        {/* フッター */}
        <div className="px-6 py-4 bg-warm-gray-50 dark:bg-warm-gray-900/30 border-t border-warm-gray-200 dark:border-warm-gray-700 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-warm-gray-700 dark:text-warm-gray-300 bg-white dark:bg-warm-gray-700 border border-warm-gray-300 dark:border-warm-gray-600 rounded-md hover:bg-warm-gray-50 dark:hover:bg-warm-gray-600 transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
