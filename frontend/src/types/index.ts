// shared types

export type LoginFormProps = {
	email: string
	password: string
	setEmail: (v: string) => void
	setPassword: (v: string) => void
	onSubmit: (e: React.FormEvent) => void
	loading?: boolean
	error?: string | null
}
