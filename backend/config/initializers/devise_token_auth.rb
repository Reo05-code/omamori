DeviseTokenAuth.setup do |config|
  # Authorization ヘッダーを毎回変えない
  config.change_headers_on_each_request = false

  # トークン有効期限を 4 週間に設定
  config.token_lifespan = 4.weeks

  # テスト環境でトークン生成コストを下げる
  config.token_cost = Rails.env.test? ? 4 : 10

  # パスワード変更時に、古いトークンを全削除する
  config.remove_tokens_after_password_reset = true
  # フロントのパスワード再設定ページ（Dev環境でメール内リンクがここへ飛ぶ）
  config.default_password_reset_url = "http://localhost:3000/reset-password"
  # メール確認成功後のリダイレクト先（必要に応じて同じURLを使う）
  config.default_confirm_success_url = "http://localhost:3000/reset-password"
end




# 1. config.change_headers_on_each_request = false
# 意味: リクエストのたびに access-token を新しいものに更新しないようにする。

# true（デフォルト）だと、Next.js側で「2つのAPIを同時に叩く（並行リクエスト）」ときにバグります。

# 例：AとBのリクエストが同時に飛ぶ → Aがトークンを更新する → Bが古いトークンでサーバーに到達 → Bが「401 Unauthorized」で爆死する（トークンローテーション問題）。

# これを false にすることで、React/Next.js での並行通信エラーを完全に防げます。
