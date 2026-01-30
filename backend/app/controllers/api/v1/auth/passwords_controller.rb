# frozen_string_literal: true

module Api
  module V1
    module Auth
      # パスワードリセットを処理するコントローラー
      # POST /api/v1/auth/password - パスワード再設定メール送信
      # PUT /api/v1/auth/password - パスワード変更
      class PasswordsController < DeviseTokenAuth::PasswordsController
        respond_to :json

        # API-only: CSRF保護を無効化
        skip_before_action :verify_authenticity_token, raise: false

        # AllowedRedirects helper をロード（lib/ 配下）
        require Rails.root.join("lib/allowed_redirects").to_s

        # `update` は DeviseTokenAuth のスーパークラスで定義されるため
        # RuboCop の LexicallyScopedActionFilter が誤検知する。
        # 明示的に抑制する。
        before_action :authenticate_api_v1_user!, only: [:update]
        # redirect_urlを検証してパスワード再設定メール送信処理を実行する
        def create
          # permit で明示的に受け付けるキーを制限しておく
          params.permit(:email, :redirect_url)

          if params[:redirect_url].present?
            sanitized = AllowedRedirects.sanitize(params[:redirect_url])
            params[:redirect_url] = sanitized
          end

          # DTA の create を呼び出す
          super
        end

        # パスワード変更完了後、古いトークンをリセット（ログイン状態を無効化）
        def update
          super

          # 成功時（HTTPレスポンスステータスが 200 または 204）のみトークンをリセット
          return unless [200, 204].include?(response.status)

          # 現在の認証ユーザーの全トークンをクリア（新たにログインする必要があるようにする）
          # devise_token_auth では tokens は Hash 形式なので、空にリセット
          user = current_api_v1_user
          return unless user

          user.update(tokens: {})
          Rails.logger.info "[PasswordsController] Tokens cleared for user #{user.email} after password update"
        end

        # パスワード再設定メール送信成功レスポンスを返す
        def render_create_success
          render json: {
            status: "success",
            message: I18n.t("api.v1.auth.success.passwords.create")
          }
        end

        # パスワード再設定メール送信失敗レスポンスを返す
        def render_create_error
          render json: {
            status: "error",
            errors: resource_errors[:full_messages].presence || [I18n.t("api.v1.auth.error.passwords.create")]
          }, status: :unprocessable_content
        end

        # パスワード変更成功レスポンスを返す
        def render_update_success
          render json: {
            status: "success",
            message: I18n.t("api.v1.auth.success.passwords.update"),
            data: resource_data
          }
        end

        # パスワード変更失敗レスポンスを返す
        def render_update_error
          render json: {
            status: "error",
            errors: resource_errors[:full_messages].presence || [I18n.t("api.v1.auth.error.passwords.update")]
          }, status: :unprocessable_content
        end
      end
    end
  end
end
