import React from 'react';
import type { ActiveWorkSessionSummary } from '@/lib/api/types';
import { getMemberWorkStatusLabel } from '@/lib/memberWorkStatus';

type Props = {
  session?: ActiveWorkSessionSummary | null;
};

export function WorkStatusBadge({ session }: Props): JSX.Element {
  const isActive = !!session?.active;

  return (
    <span
      className={`${
        isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
      } px-2 py-1 rounded-full text-xs`}
    >
      {getMemberWorkStatusLabel(session)}
    </span>
  );
}
