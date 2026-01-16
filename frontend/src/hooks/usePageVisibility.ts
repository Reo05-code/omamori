import { useState, useEffect } from 'react';

export function usePageVisibility(): boolean {
  // サーバー上では document がないので、とりあえず true を返す等の安全策をとる
  const [isVisible, setIsVisible] = useState(() => {
    return typeof document !== 'undefined' ? !document.hidden : true;
  });

  useEffect(() => {
    // ここはブラウザでのみ実行されるので document に触っても安全
    const handleChange = () => setIsVisible(!document.hidden);

    document.addEventListener('visibilitychange', handleChange);

    // マウント時の状態同期
    setIsVisible(!document.hidden);

    return () => document.removeEventListener('visibilitychange', handleChange);
  }, []);

  return isVisible;
}
