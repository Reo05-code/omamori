import RegisterForm from './RegisterForm'
import Link from 'next/link'

export default function RegisterPage() {
  return (
    <main className="font-display bg-gradient-to-br from-warm-bg to-warm-brown-100 text-warm-brown-800 antialiased min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div>
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-warm-orange-light flex items-center justify-center">
              <svg aria-hidden="true" className="h-10 w-10 text-white" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path clipRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3A5.25 5.25 0 0012 1.5zm-3.75 5.25a3.75 3.75 0 107.5 0v3h-7.5v-3z" fillRule="evenodd"></path>
              </svg>
            </div>
          </div>
          <h1 className="text-center text-3xl font-bold text-warm-brown-800">Omamoriユーザー登録</h1>
          <p className="mt-2 text-center text-sm text-warm-brown-700">新しいアカウントを作成して、大切な人を見守りましょう。</p>
        </div>

        <div className="rounded-xl bg-warm-surface/80 backdrop-blur-sm p-8 shadow-soft ring-1 ring-warm-brown-200/50">
          <RegisterForm />
          <div className="mt-6 text-center text-sm">
            <p className="text-warm-brown-600">
              すでにアカウントをお持ちですか？
              <Link className="font-bold text-warm-brown-700 hover:text-warm-orange transition-colors duration-200 ml-1" href="/login">ログイン</Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
