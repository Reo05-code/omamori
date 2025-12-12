'use client';

import { useEffect, useState } from 'react';
import { api } from '../lib/api/client';
import Spinner from '../components/ui/Spinner';
import ErrorView from '../components/common/ErrorView';

interface HealthStatus {
  status: string;
  timestamp: string;
  environment: string;
}

export default function Home() {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHealthStatus = async () => {
      try {
        const res = await api.get<HealthStatus>('/health');
        if (res.error) {
          setError(res.error);
        } else {
          setHealthStatus(res.data as HealthStatus);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchHealthStatus();
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-2xl w-full mx-4">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4 text-center">Rails + Next.js</h1>
          <p className="text-gray-600 text-center mb-8">フルスタック開発環境へようこそ</p>

          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">
              バックエンド API ステータス
            </h2>

            {loading && (
              <div className="flex items-center justify-center py-8">
                <Spinner size="lg" label="読み込み中" />
              </div>
            )}

            {error && (
              <div className="py-4">
                <ErrorView message={error} />
                <p className="text-sm text-red-600 mt-2">
                  バックエンドサーバーが起動していることを確認してください。
                </p>
              </div>
            )}

            {healthStatus && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <div className="h-3 w-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-green-800 font-semibold">接続成功</span>
                </div>
                <dl className="space-y-2 text-sm">
                  <div className="flex">
                    <dt className="font-semibold text-gray-700 w-24">Status:</dt>
                    <dd className="text-gray-600">{healthStatus.status}</dd>
                  </div>
                  <div className="flex">
                    <dt className="font-semibold text-gray-700 w-24">Environment:</dt>
                    <dd className="text-gray-600">{healthStatus.environment}</dd>
                  </div>
                  <div className="flex">
                    <dt className="font-semibold text-gray-700 w-24">Timestamp:</dt>
                    <dd className="text-gray-600">
                      {new Date(healthStatus.timestamp).toLocaleString('ja-JP')}
                    </dd>
                  </div>
                </dl>
              </div>
            )}
          </div>

          <div className="mt-8 border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">技術スタック</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-2">Backend</h4>
                <ul className="text-stext-gray-600 space-y-1">
                  <li>• Rails 7.1 (API)</li>
                  <li>• PostgreSQL 15</li>
                  <li>• RSpec / RuboCop</li>
                  <li>• FactoryBot / Faker</li>
                </ul>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-2">Frontend</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Next.js 14</li>
                  <li>• TypeScript</li>
                  <li>• TailwindCSS</li>
                  <li>• ESLint</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
