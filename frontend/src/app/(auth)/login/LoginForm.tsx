"use client"

import React from 'react'
import Link from 'next/link'
import type { LoginFormProps } from '@/types'
import ErrorView from '@/components/common/ErrorView'
import LockIcon from '@/components/ui/LockIcon'

export default function LoginForm({ email, password, setEmail, setPassword, onSubmit, loading = false, error = null }: LoginFormProps) {
	return (
		<div className="flex min-h-screen items-center justify-center p-4">
			<div className="w-full max-w-md space-y-8">
				<div>
				<div className="flex justify-center mb-4">
					<div className="h-16 w-16 rounded-full bg-warm-orange-light flex items-center justify-center">
						<LockIcon />
					</div>
				</div>
					<h1 className="text-center text-3xl font-bold text-warm-brown-800">Omamoriログイン</h1>
					<p className="mt-2 text-center text-sm text-warm-brown-700">アカウントにログインしてください</p>
				</div>

				<div className="rounded-xl bg-warm-surface/80 backdrop-blur-sm p-8 shadow-soft ring-1 ring-warm-brown-200/50">
					<form onSubmit={onSubmit} className="space-y-6">
						<ErrorView message={error} />
						<div>
							<label htmlFor="email" className="block text-sm font-medium text-warm-brown-700">メールアドレス</label>
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
							<label htmlFor="password" className="block text-sm font-medium text-warm-brown-700">パスワード</label>
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
								<Link href="#" className="font-medium text-warm-brown-600 hover:text-warm-orange transition-colors duration-200">パスワードを忘れた場合</Link>
							</div>
						</div>

						<div>
							<button
								type="submit"
								disabled={loading}
								className="flex w-full justify-center rounded-lg border border-transparent bg-warm-orange py-3 px-4 text-sm font-bold text-white shadow-md shadow-warm-orange/30 hover:bg-warm-orange-light focus:outline-none focus:ring-2 focus:ring-warm-orange focus:ring-offset-2 focus:ring-offset-warm-surface transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
							>
								{loading ? '処理中...' : 'ログイン'}
							</button>
						</div>
					</form>

					<div className="mt-8">
						<div className="relative">
							<div className="absolute inset-0 flex items-center">
								<div className="w-full border-t border-warm-brown-200" />
							</div>
							<div className="relative flex justify-center text-sm">
								<span className="bg-warm-surface px-3 text-warm-brown-500">または</span>
							</div>
						</div>

						<div className="mt-6 text-center text-sm">
							<p className="text-warm-brown-600">アカウントをお持ちでないですか？{' '}
								<Link href="#" className="font-bold text-warm-brown-700 hover:text-warm-orange transition-colors duration-200">新規登録</Link>
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
