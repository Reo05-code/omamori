'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { BasicInfoTab } from './_components/tabs/BasicInfoTab';
import { RiskAssessmentsTab } from './_components/tabs/RiskAssessmentsTab';
import { SafetyLogsTab } from './_components/tabs/SafetyLogsTab';
import { useMemberships } from './_hooks/useMemberships';
import { useRiskAssessments } from './_hooks/useRiskAssessments';
import { useSafetyLogs } from './_hooks/useSafetyLogs';

type TabKey = 'basic' | 'safety_logs' | 'risk_assessments';

function isTabKey(value: string | null): value is TabKey {
  return value === 'basic' || value === 'safety_logs' || value === 'risk_assessments';
}

/**
 * WorkLogsページ：タブUI（基本情報/移動履歴/リスク判定）で対象ユーザーの各種情報を表示。
 * memberships取得 → ユーザー選択 → 稼働中セッションから各種ログを取得・表示。
 */
export default function WorkLogsPage() {
  const params = useParams();
  const orgId = (params as { id?: string })?.id;
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<TabKey>(() => {
    const tab = searchParams.get('tab');
    return isTabKey(tab) ? tab : 'basic';
  });

  const {
    memberships,
    loading: membershipsLoading,
    error: membershipsError,
  } = useMemberships(orgId);

  const [selectedUserId, setSelectedUserId] = useState<number | null>(() => {
    // 互換のため userId / user_id を両対応（導線変更の過渡期を吸収）。
    const raw = searchParams.get('userId') ?? searchParams.get('user_id');
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  });

  const selectedMembership = useMemo(() => {
    if (!memberships || selectedUserId === null) return null;
    return memberships.find((m) => m.user_id === selectedUserId) ?? null;
  }, [memberships, selectedUserId]);

  const activeWorkSessionId = useMemo(() => {
    const session = selectedMembership?.active_work_session;
    // active=false または id不正（null/文字列など）ではSafetyLogsを取りに行かない。
    if (!session?.active) return null;
    return typeof session.id === 'number' ? session.id : null;
  }, [selectedMembership]);

  const {
    safetyLogs,
    loading: safetyLogsLoading,
    error: safetyLogsError,
    retry: retrySafetyLogs,
  } = useSafetyLogs({
    enabled: activeTab === 'safety_logs',
    workSessionId: activeWorkSessionId,
    resetKey: selectedUserId,
  });

  const {
    riskAssessments,
    loading: riskAssessmentsLoading,
    error: riskAssessmentsError,
    page: riskAssessmentsPage,
    totalPages: riskAssessmentsTotalPages,
    totalCount: riskAssessmentsTotalCount,
    canPrev: riskAssessmentsCanPrev,
    canNext: riskAssessmentsCanNext,
    prevPage: riskAssessmentsPrevPage,
    nextPage: riskAssessmentsNextPage,
    retry: retryRiskAssessments,
  } = useRiskAssessments({
    enabled: activeTab === 'risk_assessments',
    workSessionId: activeWorkSessionId,
    resetKey: selectedUserId,
  });

  const tabs: Array<{ key: TabKey; label: string }> = [
    { key: 'basic', label: '基本情報' },
    { key: 'safety_logs', label: '移動履歴' },
    { key: 'risk_assessments', label: 'リスク判定' },
  ];

  useEffect(() => {
    // memberships取得後に、URL等から渡された userId が存在しない場合は選択をリセットして安全にする。
    if (!memberships || selectedUserId === null) return;
    const exists = memberships.some((m) => m.user_id === selectedUserId);
    if (!exists) setSelectedUserId(null);
  }, [memberships, selectedUserId]);

  return (
    <div className="px-6 pt-2 pb-6">
      {/* Tab Navigation */}
      <div className="border-b border-warm-gray-200 dark:border-warm-gray-700 mb-6">
        <nav className="flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${
                  activeTab === tab.key
                    ? 'border-warm-orange text-warm-orange'
                    : 'border-transparent text-warm-gray-500 hover:text-warm-gray-700 hover:border-warm-gray-300 dark:text-warm-gray-400 dark:hover:text-warm-gray-200 dark:hover:border-warm-gray-600'
                }
              `}
              aria-current={activeTab === tab.key ? 'page' : undefined}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'basic' && (
          <BasicInfoTab
            orgId={orgId}
            memberships={memberships}
            membershipsLoading={membershipsLoading}
            membershipsError={membershipsError}
            selectedUserId={selectedUserId}
            onSelectUserId={setSelectedUserId}
            selectedMembership={selectedMembership}
            activeWorkSessionId={activeWorkSessionId}
          />
        )}
        {activeTab === 'safety_logs' && (
          <SafetyLogsTab
            memberships={memberships}
            membershipsLoading={membershipsLoading}
            membershipsError={membershipsError}
            selectedUserId={selectedUserId}
            onSelectUserId={setSelectedUserId}
            activeWorkSessionId={activeWorkSessionId}
            safetyLogs={safetyLogs}
            loading={safetyLogsLoading}
            error={safetyLogsError}
            onRetry={retrySafetyLogs}
          />
        )}
        {activeTab === 'risk_assessments' && (
          <RiskAssessmentsTab
            orgId={orgId}
            memberships={memberships}
            membershipsLoading={membershipsLoading}
            membershipsError={membershipsError}
            selectedUserId={selectedUserId}
            onSelectUserId={setSelectedUserId}
            activeWorkSessionId={activeWorkSessionId}
            riskAssessments={riskAssessments}
            loading={riskAssessmentsLoading}
            error={riskAssessmentsError}
            page={riskAssessmentsPage}
            totalPages={riskAssessmentsTotalPages}
            totalCount={riskAssessmentsTotalCount}
            canPrev={riskAssessmentsCanPrev}
            canNext={riskAssessmentsCanNext}
            onPrev={riskAssessmentsPrevPage}
            onNext={riskAssessmentsNextPage}
            onRetry={retryRiskAssessments}
          />
        )}
      </div>
    </div>
  );
}
