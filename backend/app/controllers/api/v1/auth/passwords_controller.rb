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
        # rubocop:disable Rails/LexicallyScopedActionFilter
        before_action :authenticate_api_v1_user!, only: [:update]
        # rubocop:enable Rails/LexicallyScopedActionFilter

        # パスワード再設定メール送信成功レスポンスを返す
        def render_create_success
          render json: {
            status: "success",
            message: I18n.t("api.v1.auth.success.passwords.create")
          }
        end

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

        # パスワード再設定メール送信失敗レスポンスを返す
        def render_create_error
          render json: {
            status: "error",
            errors: resource_errors[:full_messages].presence || [I18n.t("api.v1.auth.error.passwords.create")]
          }, status: :unprocessable_entity
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
          }, status: :unprocessable_entity
        end
      end
    end
  end
end
