// // パスワード再設定のページ本体
// メール内リンクから遷移してきたユーザーを想定
import ResetForm from './ResetForm'

export default function PasswordResetPage() {
  return (
    <main className="font-display bg-gradient-to-br from-warm-bg to-warm-brown-100 text-warm-brown-800 antialiased min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h1 className="text-center text-3xl font-bold text-warm-brown-800">パスワード再設定</h1>
          <p className="mt-2 text-center text-sm text-warm-brown-700">メールのリンクから来たら、新しいパスワードを入力してください。</p>
        </div>

        <div className="rounded-xl bg-warm-surface/80 backdrop-blur-sm p-8 shadow-soft ring-1 ring-warm-brown-200/50">
          <ResetForm />
        </div>
      </div>
    </main>
  )
}
