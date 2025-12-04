'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    // フォーム送信後にページがリロードされて state がリセット されるのを防ぐ
    e.preventDefault()
    // TODO: API連携実装
    console.log('Login attempt:', { email, password })
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* ヘッダー */}
        <div>
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-warm-orange-light flex items-center justify-center">
              <svg
                aria-hidden="true"
                className="h-10 w-10 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  clipRule="evenodd"
                  d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3A5.25 5.25 0 0012 1.5zm-3.75 5.25a3.75 3.75 0 107.5 0v3h-7.5v-3z"
                  fillRule="evenodd"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-center text-3xl font-bold text-warm-brown-800">
            Omamoriログイン
          </h1>
          <p className="mt-2 text-center text-sm text-warm-brown-700">
            アカウントにログインしてください
          </p>
        </div>

        {/* フォーム */}
        <div className="rounded-xl bg-warm-surface/80 backdrop-blur-sm p-8 shadow-soft ring-1 ring-warm-brown-200/50">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-warm-brown-700"
              >
                メールアドレス
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-lg border-warm-brown-200 bg-white py-3 px-4 shadow-inner-soft focus:border-warm-orange focus:ring-warm-orange text-sm placeholder-warm-brown-400"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-warm-brown-700"
              >
                パスワード
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-lg border-warm-brown-200 bg-white py-3 px-4 shadow-inner-soft focus:border-warm-orange focus:ring-warm-orange text-sm placeholder-warm-brown-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-end">
              <div className="text-sm">
                <Link
                  href="/forgot-password"
                  className="font-medium text-warm-brown-600 hover:text-warm-orange transition-colors duration-200"
                >
                  パスワードを忘れた場合
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="flex w-full justify-center rounded-lg border border-transparent bg-warm-orange py-3 px-4 text-sm font-bold text-white shadow-md shadow-warm-orange/30 hover:bg-warm-orange-light focus:outline-none focus:ring-2 focus:ring-warm-orange focus:ring-offset-2 focus:ring-offset-warm-surface transition-all duration-200"
              >
                ログイン
              </button>
            </div>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-warm-brown-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-warm-surface px-3 text-warm-brown-500">
                  または
                </span>
              </div>
            </div>

            <div className="mt-6 text-center text-sm">
              <p className="text-warm-brown-600">
                アカウントをお持ちでないですか？{' '}
                <Link
                  href="/signup"
                  className="font-bold text-warm-brown-700 hover:text-warm-orange transition-colors duration-200"
                >
                  新規登録
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
