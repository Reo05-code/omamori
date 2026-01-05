'use client';

import React, { useEffect, useState } from 'react';

/**
 * 現在時刻を表示するクライアントコンポーネント
 * ハイドレーションエラーを回避するため、クライアントでのみレンダリング
 */
export default function CurrentTime() {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    // クライアントでのみ時刻を設定
    const updateTime = () => {
      setTime(new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000); // 1秒ごとに更新

    return () => clearInterval(interval);
  }, []);

  // サーバーレンダリング時とクライアントの初回レンダリング時は空文字
  if (!time) return <div className="text-xs text-warm-brown-600 w-12" />;

  return <div className="text-xs text-warm-brown-600">{time}</div>;
}
