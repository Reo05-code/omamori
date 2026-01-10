import type { Membership } from '@/lib/api/types';

import { TargetUserSelect } from '../TargetUserSelect';

export function RiskAssessmentsTab({
  orgId,
  memberships,
  membershipsLoading,
  membershipsError,
  selectedUserId,
  onSelectUserId,
}: {
  orgId: string | undefined;
  memberships: Membership[] | null;
  membershipsLoading: boolean;
  membershipsError: string | null;
  selectedUserId: number | null;
  onSelectUserId: (userId: number | null) => void;
}) {
  return (
    <div className="bg-white dark:bg-warm-gray-800 rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4 text-warm-gray-900 dark:text-warm-gray-100">
        リスク判定
      </h2>

      {/* 今後の実装予定でも、ユーザー選択フローは他タブと揃えておく */}
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

      {selectedUserId !== null && (
        <div className="space-y-2 text-warm-gray-600 dark:text-warm-gray-400">
          <p>組織ID: {orgId || '不明'}</p>
          <p>対象user_id: {selectedUserId}</p>
          <p>リスク判定の実装は今後行います。</p>
        </div>
      )}
    </div>
  );
}
