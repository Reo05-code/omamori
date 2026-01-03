'use client';

import React from 'react';

import ErrorView from '../../components/common/ErrorView';
import PrimaryButton from '../../components/ui/PrimaryButton';
import WorkerShell from '../../components/worker/WorkerShell';
import StatusCard from '../../components/worker/StatusCard';

export default function WorkerHomePage() {
  // Step 1: まずはUIの骨組みだけ作ってレビュー → 次StepでuseWorkerSession接続
  const error: string | null = null;

  // 稼働中（見守り中）かどうかで色を切り替える
  // Step 2 以降で useWorkerSession の session 有無に接続する
  const isWorking = true;

  const statusLabel = isWorking ? '見守り中' : '待機中';
  const statusSubLabel = isWorking ? '最終確認：2分前' : '見守りを開始してください';

  const genkiRingClass = isWorking ? 'ring-secondary/30' : 'ring-warm-brown-200/50';
  const genkiAccentBgClass = isWorking ? 'bg-secondary/15' : 'bg-warm-orange-light/30';
  const genkiAccentTextClass = isWorking ? 'text-secondary' : 'text-warm-brown-800';

  return (
    <WorkerShell>
      <div className="space-y-5">
        <ErrorView message={error} />

        <StatusCard
          title="現在のステータス"
          statusLabel={statusLabel}
          statusSubLabel={statusSubLabel}
          isWorking={isWorking}
        />

        <button
          type="button"
          className={`w-full rounded-full bg-warm-surface/80 backdrop-blur-sm shadow-soft ring-1 ${genkiRingClass} aspect-square flex flex-col items-center justify-center text-center`}
          aria-label="元気タッチ"
        >
          <div
            className={`w-12 h-12 rounded-full ${genkiAccentBgClass} flex items-center justify-center mb-4`}
          >
            <span className={`material-icons-outlined ${genkiAccentTextClass}`}>check</span>
          </div>
          <div className="text-2xl font-extrabold">元気タッチ</div>
          <div className="mt-2 text-sm text-warm-brown-600">ここをタップして安否を報告</div>
        </button>

        <PrimaryButton
          className="bg-danger hover:bg-red-600 shadow-md shadow-danger/30 focus:ring-danger"
          type="button"
        >
          <span className="flex items-center justify-center gap-2">
            <span className="material-icons-outlined">warning</span>
            <span>緊急事態 / SOS</span>
          </span>
        </PrimaryButton>
      </div>
    </WorkerShell>
  );
}
