import type { ActiveWorkSessionSummary } from './api/types';

export type MemberWorkStatusLabel = '稼働中' | '停止';

export function getMemberWorkStatusLabel(
  activeWorkSession?: ActiveWorkSessionSummary | null,
): MemberWorkStatusLabel {
  return activeWorkSession?.active ? '稼働中' : '停止';
}
