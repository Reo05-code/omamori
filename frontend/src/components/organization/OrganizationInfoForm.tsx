'use client';

import { useEffect, useState, useCallback } from 'react';

import ErrorView from '@/components/common/ErrorView';
import type { Organization } from '@/lib/api/types';
import { fetchOrganization, updateOrganization } from '@/lib/api/organizations';

export type Notification = {
  message: string;
  type: 'success' | 'error' | 'info';
};

/**
 * 組織名のバリデーションルール
 * @param name 入力された組織名
 * @returns エラーメッセージ。問題ない場合は null
 * @note バックエンドのバリデーションルールと同期させること
 */
function validateOrganizationName(name: string): string | null {
  const trimmed = name.trim();

  if (!trimmed) {
    return '組織名は必須です';
  }
  if (trimmed.length > 100) {
    return '組織名は100文字以内で入力してください';
  }

  return null;
}

type OrganizationInfoFormProps = {
  /** 編集対象の組織ID */
  organizationId: string;
  /** 処理完了やエラー時の通知コールバック */
  onNotify: (n: Notification) => void;
};

/**
 * 組織情報編集フォーム
 * * 組織名の閲覧と編集機能を提供します。
 * データ取得中はローディングを表示し、保存中はフォームをロックします。
 */
export function OrganizationInfoForm({
  organizationId,
  onNotify,
}: OrganizationInfoFormProps): JSX.Element {
  // --------------------------------------------------------------------------
  // Server State (サーバーデータの状態管理)
  // --------------------------------------------------------------------------
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // --------------------------------------------------------------------------
  // Client State (UI/フォームの状態管理)
  // --------------------------------------------------------------------------
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // ユーザーが一度でも入力操作を行ったか、かつサーバー値と乖離しているか
  const [isDirty, setIsDirty] = useState(false);

  // --------------------------------------------------------------------------
  // Effects
  // --------------------------------------------------------------------------

  /**
   * 初期データの取得
   * コンポーネントのアンマウント時やID変更時にリクエストをキャンセルするため
   * AbortControllerを使用している
   */
  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      setIsLoading(true);
      setFetchError(null);

      try {
        const org = await fetchOrganization(organizationId, controller.signal);

        // 成功時: サーバーデータとフォーム初期値を同期
        setOrganization(org);
        setName(org.name ?? '');
        setIsDirty(false);
      } catch (e: unknown) {
        // コンポーネント破棄による中断はエラー扱いしない
        if (e instanceof Error && e.name === 'AbortError') return;

        console.error('OrganizationInfoForm: failed to fetch', e);
        setFetchError('組織情報の読み込みに失敗しました。');
      } finally {
        setIsLoading(false);
      }
    };

    load();

    return () => {
      controller.abort();
    };
  }, [organizationId]);

  // --------------------------------------------------------------------------
  // Handlers
  // --------------------------------------------------------------------------

  // １文字変えるごとにDirtyフラグを立てる
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    setIsDirty(true);
  }, []);

  const handleCancel = useCallback(() => {
    if (organization) {
      // サーバーデータの値にリセット
      setName(organization.name ?? '');
      setIsDirty(false);
    }
  }, [organization]);

  const handleSave = async () => {
    // UI側の状態だけでなく、送信直前にも必ずバリデーションを行う
    const validationResult = validateOrganizationName(name);
    if (validationResult) {
      onNotify({ message: validationResult, type: 'error' });
      return;
    }

    setIsSaving(true);

    try {
      // 前後の空白はAPI送信時にトリムする仕様
      const trimmedName = name.trim();

      const updated = await updateOrganization(organizationId, {
        organization: { name: trimmedName },
      });

      // 保存成功: サーバーデータを最新化し、Dirtyフラグを下ろす
      setOrganization(updated);
      setName(updated.name ?? trimmedName);
      setIsDirty(false);

      onNotify({ message: '組織名を更新しました', type: 'success' });
    } catch (e: unknown) {
      console.error('OrganizationInfoForm: failed to update', e);

      const message = e instanceof Error ? e.message : '更新に失敗しました';
      onNotify({ message, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  // --------------------------------------------------------------------------
  // Render Helpers
  // --------------------------------------------------------------------------

  const validationError = validateOrganizationName(name);
  // 変更があり、かつバリデーションエラーがない場合のみ保存可能
  const hasChanged = isDirty && organization?.name !== name;
  const canSave = !isLoading && !isSaving && hasChanged && validationError === null;

  if (isLoading) {
    // ちらつき防止のため、簡易的なローディング表示（本来はSkeleton推奨）
    return (
      <p className="text-gray-500 py-4" aria-live="polite">
        読み込み中です...
      </p>
    );
  }

  if (fetchError) {
    return <ErrorView message={fetchError} />;
  }

  return (
    <form className="space-y-4 max-w-xl" onSubmit={(e) => e.preventDefault()}>
      <div>
        <label htmlFor="org-name" className="block text-sm font-bold text-gray-700 mb-1">
          組織名
        </label>
        <div className="mt-1">
          <input
            id="org-name"
            type="text"
            name="name"
            value={name}
            onChange={handleChange}
            disabled={isSaving}
            className={`
              w-full px-3 py-2 border rounded-md shadow-sm sm:text-sm transition-colors
              focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none
              ${validationError && isDirty ? 'border-red-300 bg-red-50' : 'border-gray-300'}
              ${isSaving ? 'bg-gray-100 text-gray-500 cursor-wait' : ''}
            `}
            placeholder="例: 株式会社テック"
            aria-invalid={!!validationError}
            aria-describedby={validationError ? 'org-name-error' : undefined}
          />
        </div>

        {/* エラーメッセージ: ユーザーが入力を開始（Dirty）してから表示する */}
        {validationError && isDirty && (
          <p id="org-name-error" className="mt-1 text-sm text-red-600" role="alert">
            {validationError}
          </p>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={handleCancel}
          disabled={!isDirty || isSaving}
          className="
            px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md
            hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500
            disabled:opacity-50 disabled:cursor-not-allowed transition-colors
          "
        >
          キャンセル
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          className="
            px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md
            hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
            disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm
          "
        >
          {isSaving ? '保存中...' : '保存'}
        </button>
      </div>
    </form>
  );
}
