'use client';

import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getCurrentPosition } from '@/lib/geolocation';
import { MAP_CONFIG, MAP_STYLES, MAP_ICONS } from '@/constants/map';

// Leafletのデフォルトマーカーアイコンの修正（Next.jsでの問題回避）
// _getIconUrlはLeafletの内部プロパティで型定義に存在しないため、型チェックを無効化
// @ts-expect-error - Leaflet internal property not in type definitions
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// 選択位置用の赤いマーカーアイコン（ローカルアセット）
const selectedIcon = new L.Icon({
  iconUrl: MAP_ICONS.RED_MARKER,
  shadowUrl: MAP_ICONS.SHADOW,
  iconSize: MAP_ICONS.SIZE,
  iconAnchor: MAP_ICONS.ANCHOR,
  popupAnchor: MAP_ICONS.POPUP_ANCHOR,
  shadowSize: MAP_ICONS.SHADOW_SIZE,
});

// 現在地用の青いマーカーアイコン（ローカルアセット）
const currentLocationIcon = new L.Icon({
  iconUrl: MAP_ICONS.BLUE_MARKER,
  shadowUrl: MAP_ICONS.SHADOW,
  iconSize: MAP_ICONS.SIZE,
  iconAnchor: MAP_ICONS.ANCHOR,
  popupAnchor: MAP_ICONS.POPUP_ANCHOR,
  shadowSize: MAP_ICONS.SHADOW_SIZE,
});

type MapSelectorProps = {
  selectedLat: number | null;
  selectedLon: number | null;
  radius: number;
  onChange: (lat: number, lon: number) => void;
};

// 地図クリックイベントを処理するコンポーネント
function MapClickHandler({ onChange }: { onChange: (lat: number, lon: number) => void }) {
  useMapEvents({
    click: (e) => {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// 地図の中心を更新
function MapCenterUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function MapSelector({
  selectedLat,
  selectedLon,
  radius,
  onChange,
}: MapSelectorProps) {
  const [mapCenter, setMapCenter] = useState<[number, number]>(MAP_CONFIG.DEFAULT_CENTER);
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);

  // 選択範囲の円スタイル
  const circlePathOptions = useMemo(
    () => ({
      color: MAP_STYLES.SELECTION_COLOR,
      fillColor: MAP_STYLES.SELECTION_COLOR,
      fillOpacity: MAP_STYLES.SELECTION_FILL_OPACITY,
    }),
    [],
  );

  // 初回マウント時に現在地を取得
  useEffect(() => {
    getCurrentPosition()
      .then((pos) => {
        const center: [number, number] = [pos.latitude, pos.longitude];
        setMapCenter(center);
        setCurrentLocation(center);
        setLocationError(null);
        // 初期値として現在地を設定
        onChange(pos.latitude, pos.longitude);
      })
      .catch((error) => {
        console.warn('Geolocation failed:', error);
        setLocationError('現在地を取得できませんでした。地図から手動で選択してください。');
        // フォールバック座標（東京駅）を使用
      })
      .finally(() => {
        setIsLoadingLocation(false);
      });
  }, [onChange]);

  // 現在地に戻すボタン
  const handleResetToCurrentLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const pos = await getCurrentPosition();
      const center: [number, number] = [pos.latitude, pos.longitude];
      setMapCenter(center);
      setCurrentLocation(center);
      setLocationError(null);
      onChange(pos.latitude, pos.longitude);
    } catch (error) {
      console.error('Failed to get current location:', error);
      setLocationError('現在地を取得できませんでした');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  return (
    <div className="relative">
      {/* エラーメッセージ（アクセシビリティ対応） */}
      {locationError && (
        <div
          role="alert"
          className="mb-2 rounded-md bg-yellow-50 p-3 text-sm text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200"
        >
          <span aria-hidden="true">⚠️ </span>
          {locationError}
        </div>
      )}

      {/* 地図コンテナ（レスポンシブ高さ） */}
      <div className="relative h-[300px] sm:h-[350px] md:h-[400px] w-full rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
        <MapContainer
          center={mapCenter}
          zoom={MAP_CONFIG.DEFAULT_ZOOM}
          scrollWheelZoom={true}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* 地図クリックハンドラー */}
          <MapClickHandler onChange={onChange} />

          {/* 地図中心の更新 */}
          <MapCenterUpdater center={mapCenter} />

          {/* 現在地マーカー（青） */}
          {currentLocation && <Marker position={currentLocation} icon={currentLocationIcon} />}

          {/* 選択位置マーカー（赤）と半径の円 */}
          {selectedLat !== null && selectedLon !== null && (
            <>
              <Marker position={[selectedLat, selectedLon]} icon={selectedIcon} />
              <Circle
                center={[selectedLat, selectedLon]}
                radius={radius}
                pathOptions={circlePathOptions}
              />
            </>
          )}
        </MapContainer>

        {/* 現在地に戻すボタン */}
        <button
          type="button"
          onClick={handleResetToCurrentLocation}
          disabled={isLoadingLocation}
          className="absolute top-3 right-3 z-[1000] bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600"
          aria-label={isLoadingLocation ? '現在地を取得中' : '現在地に戻る'}
        >
          <span aria-hidden="true">{isLoadingLocation ? '取得中...' : '📍 '}</span>
          {isLoadingLocation ? '' : '現在地'}
        </button>
      </div>

      {/* 選択座標の表示 */}
      {selectedLat !== null && selectedLon !== null && (
        <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
          選択位置: 北緯 {selectedLat.toFixed(6)}°, 東経 {selectedLon.toFixed(6)}° (半径 {radius}m)
        </div>
      )}
    </div>
  );
}
