# frozen_string_literal: true

module Api
  module V1
    module Auth
      # ログイン・ログアウトを処理するコントローラー
      # POST /api/v1/auth/sign_in - ログイン
      # DELETE /api/v1/auth/sign_out - ログアウト
      class SessionsController < DeviseTokenAuth::SessionsController
        respond_to :json

        # `destroy` は DeviseTokenAuth のスーパークラスで定義されるため
        # RuboCop の LexicallyScopedActionFilter が誤検知する。
        # 明示的に抑制する。
        # rubocop:disable Rails/LexicallyScopedActionFilter
        before_action :authenticate_api_v1_user!, only: [:destroy]
        # rubocop:enable Rails/LexicallyScopedActionFilter

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
            errors: [I18n.t("api.v1.auth.error.sessions.invalid_credentials")]
          }, status: :unauthorized
        end

        # ログアウト成功時のレスポンス
        def render_destroy_success
          render json: {
            status: "success",
            message: I18n.t("api.v1.auth.sessions.signed_out")
          }, status: :ok
        end

        # ログアウト失敗時のレスポンス
        def render_destroy_error
          render json: {
            status: "error",
            errors: [I18n.t("api.v1.auth.sessions.not_signed_out")]
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
