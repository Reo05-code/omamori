"use client"

import React from 'react'
import Link from 'next/link'
import type { LoginFormProps } from '@/types'
import ErrorView from '@/components/common/ErrorView'
import OmamoriIcon from '@/components/ui/OmamoriIcon'
import Input from '@/components/ui/Input'
import PrimaryButton from '@/components/ui/PrimaryButton'

export default function LoginForm({ email, password, setEmail, setPassword, onSubmit, loading = false, error = null }: LoginFormProps) {
	return (
		<div className="flex min-h-screen items-center justify-center p-4">
			<div className="w-full max-w-md space-y-8">
				<div>
				<div className="flex justify-center mb-4">
					<div className="h-16 w-16 rounded-full bg-warm-orange-light flex items-center justify-center">
						<OmamoriIcon />
					</div>
				</div>
					<h1 className="text-center text-3xl font-bold text-warm-brown-800">Omamoriログイン</h1>
					<p className="mt-2 text-center text-sm text-warm-brown-700">アカウントにログインしてください</p>
				</div>

				<div className="rounded-xl bg-warm-surface/80 backdrop-blur-sm p-8 shadow-soft ring-1 ring-warm-brown-200/50">
					<form onSubmit={onSubmit} className="space-y-6">
						<ErrorView message={error} />
						<div>
							<Input
								id="email"
								name="email"
								type="email"
								autoComplete="email"
								required
								label="メールアドレス"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
							/>
						</div>

						<div>
							<Input
								id="password"
								name="password"
								type="password"
								autoComplete="current-password"
								required
								label="パスワード"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
							/>
						</div>

						<div className="flex items-center justify-end">
							<div className="text-sm">
								<Link href="#" className="font-medium text-warm-brown-600 hover:text-warm-orange transition-colors duration-200">パスワードを忘れた場合</Link>
							</div>
						</div>

						<div>
							<PrimaryButton type="submit" loading={loading}>
								ログイン
							</PrimaryButton>
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
								<Link href="/register" className="font-bold text-warm-brown-700 hover:text-warm-orange transition-colors duration-200">新規登録</Link>
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
