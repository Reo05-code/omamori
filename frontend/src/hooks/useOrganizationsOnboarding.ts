// ログイン中ユーザーが所属する組織を取得し、1つも無ければ「組織作成モーダルを開く」状態を作る
import { useEffect, useState } from 'react';
import { api } from '../lib/api/client';
import { API_PATHS } from '../lib/api/paths';

type Organization = {
  id: number;
  name: string;
};

type UseOrganizationsOnboardingResult = {
  showCreateOrgModal: boolean;
  setShowCreateOrgModal: React.Dispatch<React.SetStateAction<boolean>>;
  loading: boolean;
  error: string | null;
};

/**
 * Hook: 組織オンボーディング判定
 * - 組織一覧を取得して空の場合は CreateOrganizationModal を開く
 */
export function useOrganizationsOnboarding(debug?: boolean): UseOrganizationsOnboardingResult {
  const [showCreateOrgModal, setShowCreateOrgModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 画面が消えたらAPI通信を止める
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    async function fetchOrgs() {
      try {
        const path = API_PATHS.ORGANIZATIONS.BASE;
        const res = await api.get<Organization[]>(path, { signal: controller.signal });
        if (debug) console.debug('GET', path, '->', res);

        if (res.error) {
          throw new Error(res.error);
        }

        const orgs = res.data || [];

        // 組織が存在しない場合のみモーダルを開く
        if (orgs.length === 0) {
          setShowCreateOrgModal(true);
        }
      } catch (e: any) {
        // Abort(画面遷移などリクエストを意図的に中断した場合）はエラー表示しない
        if (e?.name === 'AbortError') return;
        setError('組織の取得に失敗しました');
        if (debug) console.debug('fetchOrgs error', e);
      } finally {
        setLoading(false);
      }
    }

    fetchOrgs();

    return () => {
      controller.abort();
    };
  }, [debug]);

  return { showCreateOrgModal, setShowCreateOrgModal, loading, error };
}
