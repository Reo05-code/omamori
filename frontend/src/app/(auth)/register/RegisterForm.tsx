"use client"

import { useState } from 'react'
import { signUp } from '@/lib/api/auth'
import Input from '@/components/ui/Input'
import PrimaryButton from '@/components/ui/PrimaryButton'
import ErrorView from '@/components/common/ErrorView'

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
      <ErrorView message={error} />
      {success && <div className="text-sm text-green-600">{success}</div>}

      <div>
        <Input id="full-name" name="full-name" type="text" required label="氏名" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="山田 太郎" />
      </div>

      <div>
        <Input id="email" name="email" type="email" required label="メールアドレス" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@railstutorial.org" />
      </div>

      <div>
        <Input id="phone" name="phone" type="tel" label="電話番号（任意）" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="090-1234-5678" />
      </div>

      <div>
        <Input id="password" name="password" type="password" required label="パスワード" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
      </div>

      <div>
        <Input id="password-confirm" name="password-confirm" type="password" required label="パスワード（確認）" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} placeholder="••••••••" />
      </div>

      <div className="flex items-center">
        <input id="terms-agreement" name="terms-agreement" type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="h-4 w-4 rounded border-warm-brown-200 text-warm-orange focus:ring-warm-orange" />
        <label htmlFor="terms-agreement" className="ml-2 block text-sm text-warm-brown-700">
          <a className="font-medium text-warm-brown-600 hover:text-warm-orange" href="#">利用規約</a>と
          <a className="font-medium text-warm-brown-600 hover:text-warm-orange ml-1" href="#">プライバシーポリシー</a>に同意します。
        </label>
      </div>

      <div>
        <PrimaryButton type="submit" loading={loading}>
          登録する
        </PrimaryButton>
      </div>
    </form>
  )
}
