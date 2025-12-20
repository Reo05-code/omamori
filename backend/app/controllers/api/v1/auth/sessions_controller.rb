# frozen_string_literal: true

module Api
  module V1
    module Auth
      # ログイン・ログアウトを処理するコントローラー
      # POST /api/v1/auth/sign_in - ログイン
      # DELETE /api/v1/auth/sign_out - ログアウト
      class SessionsController < DeviseTokenAuth::SessionsController
        respond_to :json

        # API-only: CSRF保護とセッションストレージを無効化
        skip_before_action :verify_authenticity_token, raise: false
        skip_before_action :verify_signed_out_user, raise: false

        # ログイン/ログアウトエンドポイントは公開API（認証前）なので
        # Originチェックをスキップ。ただし以下のセキュリティ対策は維持：
        # 1. DeviseTokenAuthによるパスワード検証（ログイン時）
        # 2. トークン検証（ログアウト時）
        # 3. rate limiting（将来的に推奨）
        skip_before_action :verify_origin!, raise: false

        # `destroy` は DeviseTokenAuth のスーパークラスで定義されるため
        # RuboCop の LexicallyScopedActionFilter が誤検知する。
        # 明示的に抑制する。
        # rubocop:disable Rails/LexicallyScopedActionFilter
        before_action :authenticate_api_v1_user!, only: [:destroy]
        # rubocop:enable Rails/LexicallyScopedActionFilter

        # DTA が自動的に Cookie をセットする処理をスキップ
        skip_after_action :update_auth_header, raise: false

        private

        # ログイン成功時：Cookieを発行して最小限のユーザ情報を返す
        def render_create_success
          # テストで呼び出しを確認するためのデバッグログ
          Rails.logger.debug("[SessionsController] render_create_success: start")

          # devise_token_auth のレスポンスヘッダ依存を避けるため、ここでCookieを発行する
          issue_encrypted_auth_cookies_for(@resource)

          render json: {
            status: "success",
            data: user_data(@resource)
          }, status: :ok
        end

        # ログイン認証失敗時のエラーレスポンスを返す
        def render_create_error_bad_credentials
          render json: {
            status: "error",
            errors: [I18n.t("api.v1.auth.error.sessions.invalid_credentials")]
          }, status: :unauthorized
        end

        # ログアウト成功時：認証Cookieをクリアして成功を返す
        def render_destroy_success
          clear_auth_cookies

          render json: {
            status: "success",
            message: I18n.t("api.v1.auth.success.sessions.signed_out")
          }, status: :ok
        end

        # ログアウト失敗時のエラーレスポンスを返す
        def render_destroy_error
          render json: {
            status: "error",
            errors: [I18n.t("api.v1.auth.sessions.not_signed_out")]
          }, status: :bad_request
        end

        # 最小限のユーザ情報をJSONで返す
        # ユーザ自身の所属情報（memberships）を返すことで、
        # クライアント側は組織ごとのロールで画面分岐できる
        def user_data(user)
          memberships = user.memberships.map do |m|
            {
              id: m.id,
              organization_id: m.organization_id,
              role: m.role
            }
          end

          {
            id: user.id,
            name: user.name,
            email: user.email,
            memberships: memberships
          }
        end

        # クリア処理は ApplicationController に移動しました（中央集約）
      end
    end
  end
end
