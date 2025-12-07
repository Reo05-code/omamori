# frozen_string_literal: true

module Api
  module V1
    module Auth
      # ログイン・ログアウトを処理するコントローラー
      # POST /api/v1/auth/sign_in - ログイン
      # DELETE /api/v1/auth/sign_out - ログアウト
      class SessionsController < DeviseTokenAuth::SessionsController
        respond_to :json

        # テスト環境では RSpec の制約上 CSRF トークンを送らないため、テスト時のみスキップします。
        # 本番/開発では CSRF 保護を有効にしてください。
        if Rails.env.test?
          skip_before_action :verify_authenticity_token, only: %i[create destroy]
        end

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
          # ApplicationController の after_action が動くことに依存するのは脆弱なので、
          # サインイン成功時はここで明示的にクッキーへ書き込みます。
          # Cookie 設定は devise_token_auth がレスポンスヘッダーを書き込む after_action に依存します。

          # 認証用クッキー発行
          issue_encrypted_auth_cookies_for(@resource)

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
