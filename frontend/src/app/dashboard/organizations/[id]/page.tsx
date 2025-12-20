/**
 * 組織内での権限に応じた画面分岐を実装するサンプルコンポーネント
 */
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getUserRole } from '../../../../lib/permissions';
import type { UserResponse } from '../../../../lib/api/types';

export default function OrganizationDashboard() {
  const params = useParams();
  const organizationId = params.id as string;
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: 実際にはAuthContextなどから current_user を取得
    // ここではダミーデータで動作確認
    const dummyUser: UserResponse = {
      id: 1,
      email: 'test@example.com',
      provider: 'email',
      uid: 'test@example.com',
      name: 'テストユーザー',
      phone_number: '09012345678',
      avatar_url: null,
      allow_password_change: false,
      memberships: [
        { id: 1, organization_id: 1, role: 'admin' },
        { id: 2, organization_id: 2, role: 'worker' },
      ],
      settings: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setUser(dummyUser);
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="p-6">読み込み中...</div>;
  }

  if (!user) {
    return <div className="p-6">ログインしてください</div>;
  }

  const role = getUserRole(user, organizationId);

  if (!role) {
    return (
      <div className="p-6">
        <p className="text-red-600">この組織へのアクセス権限がありません</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">組織ダッシュボード</h1>
        <p className="text-sm text-gray-600">
          あなたの権限:{' '}
          <span className="font-semibold">{role === 'admin' ? '管理者' : 'ワーカー'}</span>
        </p>
      </div>

      {role === 'admin' ? <AdminView /> : <WorkerView />}
    </div>
  );
}

function AdminView() {
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-2">管理者専用機能</h2>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>全メンバーの作業セッション閲覧</li>
          <li>アラート管理・対応</li>
          <li>統計ダッシュボード</li>
          <li>メンバー招待・権限変更</li>
        </ul>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-semibold mb-2">未対応アラート</h3>
          <p className="text-3xl font-bold text-red-600">3</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-semibold mb-2">稼働中メンバー</h3>
          <p className="text-3xl font-bold text-green-600">12</p>
        </div>
      </div>
    </div>
  );
}

function WorkerView() {
  return (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-2">ワーカー機能</h2>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>自分の作業セッション開始・終了</li>
          <li>安全確認ログ送信</li>
          <li>自分のアラート確認</li>
        </ul>
      </div>

      <div className="bg-white border rounded-lg p-4">
        <h3 className="font-semibold mb-4">作業セッション</h3>
        <button className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700">
          作業開始
        </button>
      </div>
    </div>
  );
}
