'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';

type TabKey = 'basic' | 'safety_logs' | 'risk_assessments';

export default function WorkLogsPage() {
  const params = useParams();
  const orgId = (params as { id?: string })?.id;
  const [activeTab, setActiveTab] = useState<TabKey>('basic');

  const tabs: Array<{ key: TabKey; label: string }> = [
    { key: 'basic', label: '基本情報' },
    { key: 'safety_logs', label: '移動履歴' },
    { key: 'risk_assessments', label: 'リスク判定' },
  ];

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
        {activeTab === 'basic' && <BasicInfoTab orgId={orgId} />}
        {activeTab === 'safety_logs' && <SafetyLogsTab orgId={orgId} />}
        {activeTab === 'risk_assessments' && <RiskAssessmentsTab orgId={orgId} />}
      </div>
    </div>
  );
}

// Placeholder component for Basic Info tab
function BasicInfoTab({ orgId }: { orgId: string | undefined }) {
  return (
    <div className="bg-white dark:bg-warm-gray-800 rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4 text-warm-gray-900 dark:text-warm-gray-100">
        基本情報
      </h2>
      <p className="text-warm-gray-600 dark:text-warm-gray-400">組織ID: {orgId || '不明'}</p>
      <p className="mt-2 text-warm-gray-600 dark:text-warm-gray-400">
        ここに作業ログの基本情報が表示されます。
      </p>
    </div>
  );
}

// Placeholder component for Safety Logs tab
function SafetyLogsTab({ orgId }: { orgId: string | undefined }) {
  return (
    <div className="bg-white dark:bg-warm-gray-800 rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4 text-warm-gray-900 dark:text-warm-gray-100">
        移動履歴
      </h2>
      <p className="text-warm-gray-600 dark:text-warm-gray-400">組織ID: {orgId || '不明'}</p>
      <p className="mt-2 text-warm-gray-600 dark:text-warm-gray-400">
        移動履歴の実装は今後行います。
      </p>
    </div>
  );
}

// Placeholder component for Risk Assessments tab
function RiskAssessmentsTab({ orgId }: { orgId: string | undefined }) {
  return (
    <div className="bg-white dark:bg-warm-gray-800 rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4 text-warm-gray-900 dark:text-warm-gray-100">
        リスク判定
      </h2>
      <p className="text-warm-gray-600 dark:text-warm-gray-400">組織ID: {orgId || '不明'}</p>
      <p className="mt-2 text-warm-gray-600 dark:text-warm-gray-400">
        リスク判定の実装は今後行います。
      </p>
    </div>
  );
}
