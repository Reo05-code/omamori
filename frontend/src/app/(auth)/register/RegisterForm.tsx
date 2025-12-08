"use client"

import { useState } from 'react'
import { signUp } from '@/lib/api/auth'

export default function RegisterForm() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [agree, setAgree] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!agree) {
      setError('利用規約に同意してください。')
      return
    }

    if (password !== passwordConfirm) {
      setError('パスワードが一致しません。')
      return
    }

      setLoading(true)
      try {
        const result = await signUp(email, password, passwordConfirm, fullName, phoneNumber)

        if (result.error) {
          setError(result.error)
        } else {
          setSuccess('登録が完了しました。ログインしてください。')
          setFullName('')
          setEmail('')
          setPassword('')
          setPasswordConfirm('')
          setPhoneNumber('')
          setAgree(false)
        }
      } catch (err) {
        setError('通信エラーが発生しました。')
      } finally {
        setLoading(false)
      }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" aria-label="register-form">
      {error && <div className="text-sm text-red-600">{error}</div>}
      {success && <div className="text-sm text-green-600">{success}</div>}

      <div>
        <label className="block text-sm font-medium text-warm-brown-700" htmlFor="full-name">氏名</label>
        <div className="mt-1">
          <input id="full-name" name="full-name" type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="山田 太郎" className="block w-full rounded-lg border-warm-brown-200 bg-white py-3 px-4 shadow-inner-soft focus:border-warm-orange focus:ring-warm-orange sm:text-sm placeholder-warm-brown-400" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-warm-brown-700" htmlFor="email">メールアドレス</label>
        <div className="mt-1">
          <input id="email" name="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@railstutorial.org" className="block w-full rounded-lg border-warm-brown-200 bg-white py-3 px-4 shadow-inner-soft focus:border-warm-orange focus:ring-warm-orange sm:text-sm placeholder-warm-brown-400" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-warm-brown-700" htmlFor="phone">電話番号（任意）</label>
        <div className="mt-1">
          <input id="phone" name="phone" type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="090-1234-5678" className="block w-full rounded-lg border-warm-brown-200 bg-white py-3 px-4 shadow-inner-soft focus:border-warm-orange focus:ring-warm-orange sm:text-sm placeholder-warm-brown-400" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-warm-brown-700" htmlFor="password">パスワード</label>
        <div className="mt-1">
          <input id="password" name="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="block w-full rounded-lg border-warm-brown-200 bg-white py-3 px-4 shadow-inner-soft focus:border-warm-orange focus:ring-warm-orange sm:text-sm placeholder-warm-brown-400" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-warm-brown-700" htmlFor="password-confirm">パスワード（確認）</label>
        <div className="mt-1">
          <input id="password-confirm" name="password-confirm" type="password" required value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} placeholder="••••••••" className="block w-full rounded-lg border-warm-brown-200 bg-white py-3 px-4 shadow-inner-soft focus:border-warm-orange focus:ring-warm-orange sm:text-sm placeholder-warm-brown-400" />
        </div>
      </div>



      <div className="flex items-center">
        <input id="terms-agreement" name="terms-agreement" type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="h-4 w-4 rounded border-warm-brown-200 text-warm-orange focus:ring-warm-orange" />
        <label htmlFor="terms-agreement" className="ml-2 block text-sm text-warm-brown-700">
          <a className="font-medium text-warm-brown-600 hover:text-warm-orange" href="#">利用規約</a>と
          <a className="font-medium text-warm-brown-600 hover:text-warm-orange ml-1" href="#">プライバシーポリシー</a>に同意します。
        </label>
      </div>

      <div>
        <button type="submit" disabled={loading} className="flex w-full justify-center rounded-lg border border-transparent bg-warm-orange py-3 px-4 text-sm font-bold text-white shadow-md shadow-warm-orange/30 hover:bg-warm-orange-light focus:outline-none focus:ring-2 focus:ring-warm-orange focus:ring-offset-2 focus:ring-offset-warm-surface transition-all duration-200">
          {loading ? '登録中...' : '登録する'}
        </button>
      </div>
    </form>
  )
}
