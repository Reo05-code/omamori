import { useEffect, useState } from 'react';

import { api } from '../lib/api/client';
import { API_PATHS } from '../lib/api/paths';
import type { WorkSession } from '../lib/api/types';
import type { Organization } from '../types';

type Options = {
  session: WorkSession | null;
  onError?: (message: string) => void;
};

export function useWorkerOrganization({ session, onError }: Options) {
  const [organizationId, setOrganizationId] = useState<number | null>(null);
  const [loadingOrg, setLoadingOrg] = useState<boolean>(true);

  // 進行中セッションがあれば組織IDは確定できる
  useEffect(() => {
    if (!organizationId && session?.organization_id) {
      setOrganizationId(session.organization_id);
      setLoadingOrg(false);
    }
  }, [organizationId, session?.organization_id]);

  // 組織IDがない場合は最初の組織を取得
  useEffect(() => {
    if (!organizationId && !session) {
      const ctrl = new AbortController();
      setLoadingOrg(true);

      async function fetchOrgs() {
        try {
          const res = await api.get<Organization[]>(API_PATHS.ORGANIZATIONS.BASE, {
            signal: ctrl.signal,
          });

          if (res.error) {
            throw new Error(res.error);
          }

          const orgs = res.data || [];

          if (orgs.length === 0) {
            onError?.('組織が見つかりません');
          } else {
            setOrganizationId(orgs[0].id);
          }
        } catch (e: any) {
          if (e?.name === 'AbortError') return;
          console.error('failed to fetch organizations', e);
          onError?.('組織の取得に失敗しました');
        } finally {
          setLoadingOrg(false);
        }
      }

      fetchOrgs();
      return () => ctrl.abort();
    }
    if (organizationId) {
      setLoadingOrg(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId, session]);

  return {
    organizationId,
    setOrganizationId,
    loadingOrg,
  };
}
