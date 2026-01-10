import type { Membership } from '@/lib/api/types';

function renderName(m: Membership): string {
  if (m.name) return m.name;
  return '（名前なし）';
}

export function TargetUserSelect({
  memberships,
  loading,
  error,
  selectedUserId,
  onSelectUserId,
}: {
  memberships: Membership[] | null;
  loading: boolean;
  error: string | null;
  selectedUserId: number | null;
  onSelectUserId: (userId: number | null) => void;
}) {
  const disabled = loading || !!error || !memberships || memberships.length === 0;

  return (
    <div className="mb-4">
      <label
        htmlFor="target-user"
        className="block text-sm font-medium text-warm-gray-700 dark:text-warm-gray-200 mb-2"
      >
        対象ユーザー
      </label>
      <select
        id="target-user"
        className="w-full px-3 py-2 border border-warm-gray-300 rounded-md bg-white dark:bg-warm-gray-900/30 dark:border-warm-gray-700 text-warm-gray-900 dark:text-warm-gray-100 focus:outline-none focus:ring-2 focus:ring-warm-orange focus:border-warm-orange disabled:opacity-50"
        value={selectedUserId ?? ''}
        disabled={disabled}
        onChange={(e) => {
          const raw = e.target.value;
          if (!raw) {
            onSelectUserId(null);
            return;
          }
          // <select> は文字列を返すため number へ変換。NaN 等は null 扱いで安全に落とす。
          const parsed = Number(raw);
          onSelectUserId(Number.isFinite(parsed) ? parsed : null);
        }}
      >
        <option value="">選択してください</option>
        {(memberships ?? []).map((m) => (
          <option key={m.id} value={m.user_id}>
            {renderName(m)}
          </option>
        ))}
      </select>

      {loading && (
        <p className="mt-2 text-sm text-warm-gray-600 dark:text-warm-gray-400">読み込み中です...</p>
      )}
      {!loading && error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {!loading && !error && memberships && memberships.length === 0 && (
        <p className="mt-2 text-sm text-warm-gray-600 dark:text-warm-gray-400">
          メンバーが見つかりません。
        </p>
      )}
    </div>
  );
}
