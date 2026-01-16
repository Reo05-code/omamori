'use client';

import { useEffect, useMemo, useRef } from 'react';
import { MapContainer, Marker, TileLayer, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { LatestLocationPin } from '@/lib/api/types';

// デフォルト設定
const DEFAULT_CENTER: L.LatLngExpression = [35.681236, 139.767125];
const DEFAULT_ZOOM = 13;

/**
 * データの更新があっても、ユーザーが操作中なら邪魔をしない
 */
function AutoFitBounds({ locations }: { locations: LatestLocationPin[] }) {
  const map = useMap();
  const hasFitOnce = useRef(false);

  useEffect(() => {
    if (!locations.length || hasFitOnce.current) {
      return;
    }

    const bounds = L.latLngBounds(locations.map((loc) => [loc.latitude, loc.longitude]));

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], animate: true });
      hasFitOnce.current = true;
    }
  }, [locations, map]);

  return null;
}

/**
 * 初回描画やコンテナサイズ変更時に Leaflet のサイズを再計算する
 */
function MapRevalidator() {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();

    const invalidate = () => {
      map.invalidateSize();
    };

    map.whenReady(invalidate);

    let observer: ResizeObserver | null = null;

    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => {
        invalidate();
      });
      observer.observe(container);
    }

    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, [map]);

  return null;
}

// アイコン生成ロジック（useMemo外に出して純粋関数化）
const createCustomIcon = () => {
  return L.divIcon({
    className: 'bg-transparent border-0 !m-0 !p-0',
    html: `<svg width="16" height="16" viewBox="0 0 16 16" style="margin: 0; padding: 0; display: block;">
      <circle cx="8" cy="8" r="6" fill="#f97316" stroke="white" stroke-width="2" style="filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.1));"/>
    </svg>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -8],
  });
};

export default function MapView({ locations }: { locations: LatestLocationPin[] }) {
  // マーカーアイコンは不変なので1回だけ生成
  const icon = useMemo(() => createCustomIcon(), []);

  return (
    <div className="h-full w-full relative isolation-auto">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        className="h-full w-full rounded-lg z-0" // z-index管理を意識
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* 自動フィット制御 */}
        <MapRevalidator />
        <AutoFitBounds locations={locations} />

        {locations.map((loc) => (
          <Marker key={loc.work_session_id} position={[loc.latitude, loc.longitude]} icon={icon}>
            <Tooltip
              permanent // 常に表示
              direction="top"
              offset={[0, -8]}
              opacity={0.9}
              className="!bg-white/90 !text-gray-900 !border-0 !shadow-sm !rounded-md !px-2 !py-0.5 font-medium text-xs"
            >
              {loc.user_name}
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
