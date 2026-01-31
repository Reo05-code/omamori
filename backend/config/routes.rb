Rails.application.routes.draw do
  # Root path for Render health check
  root "health#index"
  # Health check endpoint
  get "health", to: "health#index"

  mount LetterOpenerWeb::Engine, at: "/letter_opener" if Rails.env.development?

  namespace :api, defaults: { format: :json } do
    namespace :v1 do
      mount_devise_token_auth_for "User", at: "auth",
                                          skip: %i[omniauth_callbacks confirmations unlocks],
                                          controllers: {
                                            sessions: "api/v1/auth/sessions",
                                            registrations: "api/v1/auth/registrations",
                                            passwords: "api/v1/auth/passwords",
                                            token_validations: "api/v1/auth/token_validations"
                                          }
      # SPA クライアント向け CSRF 取得エンドポイント（form_authenticity_token を返し、
      # XSRF-TOKEN クッキーをセットします）
      get "auth/csrf", to: "auth/csrf#show"

      # Organization と関連リソースのエンドポイント
      resources :organizations, only: %i[index create show update] do
        resources :memberships, only: %i[index update destroy]
        resources :invitations, only: %i[index create destroy]
        # 管理者用: 組織内のアラート管理
        resources :alerts, only: %i[index update], controller: "organizations/alerts" do
          collection do
            get :summary
          end
        end
        # 管理者用: アクティブな作業セッションの最新位置情報
        resources :active_work_sessions, only: [], controller: "organizations/active_work_sessions" do
          collection do
            get :latest_locations
          end
        end
      end

      # 招待のプレビュー（未認証）
      get "invitations/:token/preview", to: "invitations#preview"
      # 招待の受諾（認証必須）
      post "invitations/accept", to: "invitations#accept"

      # WorkSession（作業セッション）
      resources :work_sessions, only: %i[create show] do
        collection do
          get :current
        end
        member do
          post :finish
          post :cancel
        end

        # SafetyLog（生存報告ログ）
        resources :safety_logs, only: %i[index create destroy]

        # RiskAssessment（リスク判定履歴）
        resources :risk_assessments, only: %i[index]

        # 作業者用: SOSアラートの作成
        resources :alerts, only: %i[create]
      end
    end
  end
end
