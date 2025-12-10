"use client"

import React, { useState } from 'react'
import { updatePassword } from '@/lib/api/auth'
import Input from '@/components/ui/Input'
import PrimaryButton from '@/components/ui/PrimaryButton'
import ErrorView from '@/components/common/ErrorView'
import { sanitizeErrorMessage, isStrongPassword } from '@/lib/utils'
import { useRouter, useSearchParams } from 'next/navigation'

// ResetForm:
// - リセット用リンクに含まれる `token` / `client` / `uid` をクエリから取得する。
// - 新しいパスワードを検証して API に送信し、成功時は `/login` にリダイレクトする。

export default function ResetForm() {
  const searchParams = useSearchParams()
  const router = useRouter()

  // クエリパラメータから認証トークン等を取得
  const token = searchParams.get('token') || searchParams.get('access-token')
  const client = searchParams.get('client')
  const uid = searchParams.get('uid')

  // ローカル状態: 入力中のパスワード、確認用、送信中フラグ、エラーメッセージ
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // パスワード検証: 8文字以上、英大文字・小文字、数字を含む
  const passwordValid = isStrongPassword(password)
  const passwordsMatch = password === passwordConfirmation

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!token || !client || !uid) {
      setError('無効なリセットリンクです')
      return
    }

    setLoading(true)
    try {
      // API に渡す認証ヘッダーを作成（token 等はヘッダーで送る仕様）
      const headers: Record<string, string> = {
        'access-token': token,
        client: client,
        uid: uid,
      }

      // パスワード更新 API を呼び出す
      const res = await updatePassword(password, passwordConfirmation, headers)

      const success = res.status === 200 || res.status === 204
      if (!success) {
        // API 応答のメッセージは直接表示せず、サニタイズしてユーザーに見せる
        const msg = res.error ?? `エラーが発生しました (${res.status})`
        setError(sanitizeErrorMessage(msg))
        return
      }

      // 成功したらログイン画面へ
      router.push('/login')
    } catch (err: unknown) {
      // 予期しない例外はコンソールに残しつつ、表示はユーザー向けに抑える
      console.error(err)
      if (err instanceof Error) setError(sanitizeErrorMessage(err.message) ?? '通信エラーが発生しました')
      else setError('通信エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <ErrorView message={error} />

      <Input id="password" name="password" type="password" required aria-describedby="pw-help" label="新しいパスワード" value={password} onChange={(e) => setPassword(e.target.value)} />

      <Input id="passwordConfirmation" name="passwordConfirmation" type="password" required label="パスワードの確認" value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.target.value)} />

      <div id="pw-help" className="text-sm text-warm-brown-600" aria-live="polite">
        <p>※ パスワードは8文字以上、英大文字・小文字、数字を含めてください。</p>
        <p className={"mt-1 " + (password ? (passwordValid ? 'text-green-600' : 'text-red-600') : '')}>
          {password ? (passwordValid ? 'パスワード要件を満たしています' : 'パスワードの要件を満たしていません') : ''}
        </p>
        <p className={passwordConfirmation ? (passwordsMatch ? 'text-green-600' : 'text-red-600') : ''}>
          {passwordConfirmation ? (passwordsMatch ? 'パスワードが一致しています' : '確認パスワードと一致していません') : ''}
        </p>
      </div>

      <div>
        <PrimaryButton type="submit" loading={loading} disabled={loading || !passwordValid || !passwordsMatch}>
          パスワードをリセット
        </PrimaryButton>
      </div>
    </form>
  )
}
