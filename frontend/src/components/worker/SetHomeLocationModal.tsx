'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { updateUser } from '@/lib/api/auth';
import type { UserResponse } from '@/lib/api/types';
import { RADIUS_OPTIONS, DEFAULT_RADIUS, type RadiusOption } from '@/constants/map';
import { WORKER, COMMON } from '@/constants/ui-messages';

// MapSelectorをSSR無効化して動的インポート
const MapSelector = dynamic(() => import('./MapSelector'), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] sm:h-[350px] md:h-[400px] flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
      <p className="text-gray-500 dark:text-gray-400">地図を読み込んでいます...</p>
    </div>
  ),
});

type Props = {
  open: boolean;
  onClose: () => void;
  onCompleted?: (updatedUser?: UserResponse) => void;
  onNotify?: (message: string, type: 'success' | 'error' | 'info') => void;
  // オンボーディング時はtrue（ESC/背景クリック無効）
  forceCreate?: boolean;
};

export default function SetHomeLocationModal({
  open,
  onClose,
  onCompleted,
  onNotify,
  forceCreate,
}: Props) {
  const [selectedLat, setSelectedLat] = useState<number | null>(null);
  const [selectedLon, setSelectedLon] = useState<number | null>(null);
  const [radius, setRadius] = useState<RadiusOption>(DEFAULT_RADIUS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  // モーダルクローズ処理
  const handleClose = useCallback(() => {
    if (forceCreate || isLoading) return;
    onClose();
  }, [forceCreate, isLoading, onClose]);

  // ESCキーと背景スクロール禁止
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, handleClose]);

  // 地図から座標が選択されたときのハンドラー
  const handleMapChange = useCallback((lat: number, lon: number) => {
    setSelectedLat(lat);
    setSelectedLon(lon);
    setError(null);
  }, []);
  // 半径選択ハンドラー
  const handleRadiusChange = (newRadius: RadiusOption) => {
    setRadius(newRadius);
  };

  // 送信処理
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (selectedLat === null || selectedLon === null) {
      setError(WORKER.SETTINGS.MESSAGES.COORDINATE_REQUIRED);
      return;
    }

    // 座標の範囲チェック（セキュリティ対策）
    if (selectedLat < -90 || selectedLat > 90 || selectedLon < -180 || selectedLon > 180) {
      setError(WORKER.SETTINGS.MESSAGES.VALIDATION_ERROR);
      return;
    }

    setIsLoading(true);
    try {
      const response = await updateUser({
        home_latitude: selectedLat,
        home_longitude: selectedLon,
        home_radius: radius,
      });

      onNotify?.(WORKER.SETTINGS.MESSAGES.HOME_LOCATION_SUCCESS, 'success');
      // 更新されたユーザー情報を親に渡す
      const updatedUser = response.error ? undefined : response.data?.data;
      onCompleted?.(updatedUser);
      // onClose() は親コンポーネントの onCompleted で呼ばれる
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to update user:', err);
      }
      setError(WORKER.SETTINGS.MESSAGES.LOCATION_UPDATE_FAILED);
      onNotify?.(WORKER.SETTINGS.MESSAGES.LOCATION_UPDATE_FAILED, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // スキップ処理
  const handleSkip = () => {
    if (isLoading) return;
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !forceCreate) {
          handleClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        className="relative w-full max-w-3xl rounded-xl bg-white dark:bg-gray-800 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {WORKER.SETTINGS.LABELS.LOCATION_TITLE}
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {WORKER.SETTINGS.LABELS.LOCATION_DESCRIPTION}
          </p>
        </div>

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="px-6 py-4">
          {/* エラーメッセージ */}
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-200">
              {error}
            </div>
          )}

          {/* 地図エリア */}
          <div className="mb-4">
            <MapSelector
              selectedLat={selectedLat}
              selectedLon={selectedLon}
              radius={radius}
              onChange={handleMapChange}
            />
          </div>

          {/* 半径選択 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {WORKER.SETTINGS.LABELS.LOCATION_RANGE}
            </label>
            <div className="flex gap-3">
              {RADIUS_OPTIONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => handleRadiusChange(r)}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    radius === r
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {r}m
                </button>
              ))}
            </div>
          </div>

          {/* ボタングループ */}
          <div className="flex gap-3 justify-end">
            {!forceCreate && (
              <button
                type="button"
                onClick={handleSkip}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
              >
                {WORKER.SETTINGS.BUTTONS.SKIP_FOR_NOW}
              </button>
            )}
            <button
              type="submit"
              disabled={isLoading || selectedLat === null || selectedLon === null}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? COMMON.STATUS.LOADING : WORKER.SETTINGS.BUTTONS.SET}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
