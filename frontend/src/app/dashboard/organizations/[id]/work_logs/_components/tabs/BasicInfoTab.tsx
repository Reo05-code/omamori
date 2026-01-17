import type { Membership } from '@/lib/api/types';
import { ROLE_LABELS } from '@/constants/labels';

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
          {/* デバッグ用の内部IDは非表示（必要時にコメント解除）
          <p className="text-xs text-gray-400">組織ID: {orgId || '不明'}</p>
          <p className="text-xs text-gray-400">user_id: {selectedMembership.user_id}</p>
          */}
          <p>メールアドレス: {selectedMembership.email ?? '—'}</p>
          <p>
            権限:{' '}
            {selectedMembership.role && selectedMembership.role in ROLE_LABELS
              ? ROLE_LABELS[selectedMembership.role as keyof typeof ROLE_LABELS]
              : '—'}
          </p>
          <p>
            ステータス:{' '}
            {activeWorkSessionId ? (
              <>
                <span className="font-medium text-green-600 dark:text-green-400">見守り中</span>
                {/* <span className="text-sm ml-1">(セッションID: {activeWorkSessionId})</span> */}
              </>
            ) : (
              <span className="text-gray-500">待機中</span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
