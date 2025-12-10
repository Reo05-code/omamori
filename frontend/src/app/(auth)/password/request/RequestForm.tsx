"use client"

import React, { useState } from 'react'
import { requestPasswordReset } from '@/lib/api/auth'
import Input from '@/components/ui/Input'
import PrimaryButton from '@/components/ui/PrimaryButton'
import ErrorView from '@/components/common/ErrorView'
import Link from 'next/link'
import { sanitizeErrorMessage } from '@/lib/utils'

/**
 * 概要:
 * - パスワードリセット用のメール送信フォーム
 * - 入力されたメールアドレスを `redirectUrl` と共にサーバへ送信する
 */
type RequestFormProps = {
  redirectUrl: string
  onSuccess?: () => void
}

export default function RequestForm({ redirectUrl, onSuccess }: RequestFormProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      // 入力の先頭・末尾の空白を除去して送信
      const trimmed = email.trim()

      // サーバへパスワードリセットメールのリクエストを送る
      const res = await requestPasswordReset(trimmed, redirectUrl)

      // サーバは 204 No Content を返す場合や data を返す場合があるため
      // 両方を成功と見なす
        const success = res.status === 200 || res.status === 204
        if (!success) {
          const msg = res.error ?? `エラーが発生しました (${res.status})`
          setError(sanitizeErrorMessage(msg))
          return
        }

      // 成功時の振る舞いはページ側に委譲できるようコールバックを呼ぶ
      if (onSuccess) {
        onSuccess()
      } else {
        setSent(true)
      }
    } catch (err: unknown) {
      // unknown を受け取って安全にメッセージを取り出す
      if (err instanceof Error) {
        setError(sanitizeErrorMessage(err.message) ?? '通信エラーが発生しました')
      } else {
        // 想定外の例外は汎用メッセージにする
        setError('通信エラーが発生しました')
      }
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="space-y-4 text-center">
        <h2 className="text-xl font-bold">リセットメールを送信しました</h2>
        <p className="text-sm text-warm-brown-700">登録済みのメールアドレスに再設定リンクを送りました。メールを確認してください。</p>
        <div>
          <Link href="/login" className="text-warm-brown-700 font-medium hover:text-warm-orange">ログイン画面に戻る</Link>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <ErrorView message={error} />
      <Input id="email" name="email" type="email" required label="登録メールアドレス" value={email} onChange={(e) => setEmail(e.target.value)} />
      <div>
        <PrimaryButton type="submit" loading={loading} disabled={loading || email.trim().length === 0 || !/\S+@\S+\.\S+/.test(email.trim())}>
          リセットメールを送信
        </PrimaryButton>
      </div>
      <div className="text-sm text-center">
        <Link href="/login" className="text-warm-brown-600 hover:text-warm-orange">ログイン画面に戻る</Link>
      </div>
    </form>
  )
}
