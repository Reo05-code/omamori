"use client"

import React, { useState } from 'react'
import LoginForm from './LoginForm'

export default function Page() {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setError(null)
		setLoading(true)
		try {
			// TODO: call API here. For now just log the values.
			console.log('login attempt', { email, password })
		} catch (err) {
			setError('通信エラーが発生しました')
		} finally {
			setLoading(false)
		}
	}

	return <LoginForm email={email} password={password} setEmail={setEmail} setPassword={setPassword} onSubmit={handleSubmit} loading={loading} error={error} />
}
