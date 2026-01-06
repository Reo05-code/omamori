import React from 'react';
import type { Membership } from '@/lib/api/types';

type Props = {
  member: Membership;
  name: string;
  isProcessing: boolean;
  onToggle: (member: Membership) => void;
};

export function MemberActionToggle({ member, name, isProcessing, onToggle }: Props): JSX.Element {
  const isActive = !!member.active_work_session?.active;

  return (
    <div className="flex items-center">
      <button
        type="button"
        role="switch"
        aria-checked={isActive}
        aria-label={`${name}の見守りを${isActive ? '終了' : '開始'}`}
        data-testid={`remote-toggle-${member.id}`}
        disabled={isProcessing}
        onClick={() => onToggle(member)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          isActive ? 'bg-green-600' : 'bg-gray-300'
        } ${isProcessing ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            isActive ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
      {isProcessing ? <span className="ml-2 text-xs text-gray-500">操作中...</span> : null}
    </div>
  );
}
