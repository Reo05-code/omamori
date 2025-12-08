Rails.application.routes.draw do
  # 開発環境向け: LetterOpenerWeb をマウントして送信メールをブラウザで確認
  if Rails.env.development?
    mount LetterOpenerWeb::Engine, at: "/letter_opener"
  end
  # Root path for Render health check
  root "health#index"
  # Health check endpoint
  get "health", to: "health#index"

  namespace :api, defaults: { format: :json } do
    namespace :v1 do
      mount_devise_token_auth_for "User", at: "auth",
        skip: [:omniauth_callbacks, :confirmations, :unlocks],
        controllers: {
          sessions: "api/v1/auth/sessions",
          registrations: "api/v1/auth/registrations",
          passwords: "api/v1/auth/passwords",
          token_validations: "api/v1/auth/token_validations"
        }
      # SPA クライアント向け CSRF 取得エンドポイント（form_authenticity_token を返し、
      # XSRF-TOKEN クッキーをセットします）
      get "auth/csrf", to: "auth/csrf#show"
    end
  end
end
