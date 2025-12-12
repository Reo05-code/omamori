// パスワードリセットメール送信用のページ
// ユーザーがメールアドレスを入力 → サーバーが reset_link を送信する流れ
'use client';

import { useState } from 'react';
import RequestForm from './RequestForm';

export default function PasswordRequestPage() {
  const [sent, setSent] = useState(false);

  // URL が必須のため、環境変数が未設定なら明示的にエラーで止める
  const envBase = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!envBase) {
    // ログを残しつつ、ユーザーには親切な案内を表示する
    // (CIで必須envチェックを導入する）
    console.error('NEXT_PUBLIC_API_BASE_URL is not set. Password reset links cannot be generated.');

    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold">現在この機能は利用できません</h1>
          <p className="mt-2 text-sm text-warm-brown-700">
            サービス設定が完了していないため、パスワードリセット機能は一時的に利用できません。問題が続く場合は管理者にお問い合わせください。
          </p>
        </div>
      </main>
    );
  }

  // 末尾スラッシュを削除（/password/reset が二重にならないように）
  const normalizedBase = envBase.replace(/\/$/, '');
  const redirectUrl = `${normalizedBase}/password/reset`;

  return (
    <main className="font-display bg-gradient-to-br from-warm-bg to-warm-brown-100 text-warm-brown-800 antialiased min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h1 className="text-center text-3xl font-bold text-warm-brown-800">
            パスワードをリセット
          </h1>
          <p className="mt-2 text-center text-sm text-warm-brown-700">
            登録済みのメールアドレスを入力して、再設定用のリンクを受け取ってください。
          </p>
        </div>

        <div className="rounded-xl bg-warm-surface/80 backdrop-blur-sm p-8 shadow-soft ring-1 ring-warm-brown-200/50">
          {sent ? (
            <div className="space-y-4 text-center">
              <h2 className="text-xl font-bold">リセットメールを送信しました</h2>
              <p className="text-sm text-warm-brown-700">
                登録済みのメールアドレスに再設定リンクを送りました。メールを確認してください。
              </p>
              <div>
                <a href="/login" className="text-warm-brown-700 font-medium hover:text-warm-orange">
                  ログイン画面に戻る
                </a>
              </div>
            </div>
          ) : (
            <RequestForm redirectUrl={redirectUrl} onSuccess={() => setSent(true)} />
          )}
        </div>
      </div>
    </main>
  );
}
