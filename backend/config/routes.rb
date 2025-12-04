Rails.application.routes.draw do
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
    end
  end
end
