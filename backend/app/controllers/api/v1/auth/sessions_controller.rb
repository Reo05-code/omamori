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
          # Debug: このコントローラの処理が呼ばれたことを確認するためのログ
          # テスト実行中に render_create_success が実行されるかを追跡します
          Rails.logger.debug("[SessionsController] render_create_success: start")
          # devise_token_auth は既にヘッダ (access-token, client, uid) を設定している。
          # devise_token_auth は既にヘッダ (access-token, client, uid) を設定している。
          # ApplicationController の after_action が動くことに依存するのは脆弱なので、
          # サインイン成功時はここで明示的にクッキーへ書き込みます。
          # Debug: レスポンスヘッダーからクッキーへの書き込み処理を呼び出す直前/直後の状態を記録
          # （devise_token_auth のヘッダー書き込みタイミング確認用）
          Rails.logger.debug("[SessionsController] calling set_auth_cookies_from_headers")
          set_auth_cookies_from_headers
          Rails.logger.debug("[SessionsController] after set_auth_cookies_from_headers")

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
          clear_auth_cookies

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

        # クリア処理は ApplicationController に移動しました（中央集約）
      end
    end
  end
end
