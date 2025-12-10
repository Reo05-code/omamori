"use client"

import React, { useState } from 'react'
import { updatePassword } from '@/lib/api/auth'
import Input from '@/components/ui/Input'
import PrimaryButton from '@/components/ui/PrimaryButton'
import ErrorView from '@/components/common/ErrorView'
import { sanitizeErrorMessage } from '@/lib/utils'
import { useRouter, useSearchParams } from 'next/navigation'

export default function ResetForm() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const token = searchParams.get('token') || searchParams.get('access-token')
  const client = searchParams.get('client')
  const uid = searchParams.get('uid')

  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // パスワード検証
  const passwordValid = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}/.test(password)
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
      const headers: Record<string, string> = {
        'access-token': token,
        client: client,
        uid: uid,
      }

      const res = await updatePassword(password, passwordConfirmation, headers)

      const success = res.status === 200 || res.status === 204
      if (!success) {
        const msg = res.error ?? `エラーが発生しました (${res.status})`
        setError(sanitizeErrorMessage(msg))
        return
      }

      // 成功したらログイン画面へ
      router.push('/login')
    } catch (err: unknown) {
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

      <div id="pw-help" className="text-sm text-warm-brown-600">
        <p>※ パスワードは8文字以上、英大文字・小文字、数字を含めてください。</p>
        <p className="mt-1">{password ? (passwordValid ? 'パスワード要件を満たしています' : 'パスワードの要件を満たしていません') : ''}</p>
        <p>{passwordConfirmation ? (passwordsMatch ? '確認一致しています' : '確認パスワードと一致しません') : ''}</p>
      </div>

      <div>
        <PrimaryButton type="submit" loading={loading} disabled={loading || !passwordValid || !passwordsMatch}>
          パスワードをリセット
        </PrimaryButton>
      </div>
    </form>
  )
}
