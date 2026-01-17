import React from 'react';

type Props = {
  label: string;
  variant: 'active' | 'inactive';
};

/**
 * 作業ステータスを表示するバッジコンポーネント
 * ラベルと色のバリエーションは親コンポーネントで決定される
 */
export function WorkStatusBadge({ label, variant }: Props): JSX.Element {
  const colorClass =
    variant === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600';

  return <span className={`${colorClass} px-2 py-1 rounded-full text-xs`}>{label}</span>;
}
