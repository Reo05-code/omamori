# frozen_string_literal: true

module Api
  module V1
    module Auth
      # ログイン・ログアウトを処理するコントローラー
      # POST /api/v1/auth/sign_in - ログイン
      # DELETE /api/v1/auth/sign_out - ログアウト
      class SessionsController < DeviseTokenAuth::SessionsController
        respond_to :json

        before_action :authenticate_user!, only: [:destroy]
        
        private

        # ログイン成功時のレスポンス
        def render_create_success
          render json: {
            status: "success",
            data: user_data(@resource)
          }, status: :ok
        end

        # ログイン失敗時のレスポンス
        def render_create_error_bad_credentials
          render json: {
            status: "error",
            errors: [I18n.t('devise.failure.invalid', authentication_keys: 'メールアドレス')]
          }, status: :unauthorized
        end

        # ログアウト成功時のレスポンス
        def render_destroy_success
          render json: {
            status: "success",
            message: I18n.t('devise.sessions.signed_out')
          }, status: :ok
        end

        # ログアウト失敗時のレスポンス
        def render_destroy_error
          render json: {
            status: "error",
            errors: [I18n.t('devise.sessions.not_signed_out')]
          }, status: :bad_request
        end

        # ユーザー情報を返すJSONを最小化
        def user_data(user)
          {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
          }
        end
      end
    end
  end
end
