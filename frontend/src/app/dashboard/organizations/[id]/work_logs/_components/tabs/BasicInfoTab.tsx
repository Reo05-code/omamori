import type { Membership } from '@/lib/api/types';

import { TargetUserSelect } from '../TargetUserSelect';

export function BasicInfoTab({
  orgId,
  memberships,
  membershipsLoading,
  membershipsError,
  selectedUserId,
  onSelectUserId,
  selectedMembership,
  activeWorkSessionId,
}: {
  orgId: string | undefined;
  memberships: Membership[] | null;
  membershipsLoading: boolean;
  membershipsError: string | null;
  selectedUserId: number | null;
  onSelectUserId: (userId: number | null) => void;
  selectedMembership: Membership | null;
  activeWorkSessionId: number | null;
}) {
  return (
    <div className="bg-white dark:bg-warm-gray-800 rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4 text-warm-gray-900 dark:text-warm-gray-100">
        基本情報
      </h2>

      {/* 全タブ共通: まず対象ユーザーを選択してから詳細を表示する */}
      <TargetUserSelect
        memberships={memberships}
        loading={membershipsLoading}
        error={membershipsError}
        selectedUserId={selectedUserId}
        onSelectUserId={onSelectUserId}
      />

      {selectedUserId === null && (
        <p className="text-warm-gray-600 dark:text-warm-gray-400">
          対象ユーザーを選択してください。
        </p>
      )}

      {selectedUserId !== null && selectedMembership && (
        <div className="space-y-2 text-warm-gray-600 dark:text-warm-gray-400">
          {/* 基本情報は現状プレースホルダ（最低限の確認用表示）。 */}
          <p>組織ID: {orgId || '不明'}</p>
          <p>user_id: {selectedMembership.user_id}</p>
          <p>email: {selectedMembership.email ?? '—'}</p>
          <p>role: {selectedMembership.role ?? '—'}</p>
          <p>稼働中セッション: {activeWorkSessionId ? `id=${activeWorkSessionId}` : 'なし'}</p>
        </div>
      )}
    </div>
  );
}
