# frozen_string_literal: true

module Api
  module V1
    module Auth
      # パスワードリセットを処理するコントローラー
      # POST /api/v1/auth/password - パスワード再設定メール送信
      # PUT /api/v1/auth/password - パスワード変更
      class PasswordsController < DeviseTokenAuth::PasswordsController
        respond_to :json

        # AllowedRedirects helper をロード（lib/ 配下）
        require Rails.root.join('lib', 'allowed_redirects').to_s

        # `update` は DeviseTokenAuth のスーパークラスで定義されるため
        # RuboCop の LexicallyScopedActionFilter が誤検知する。
        # 明示的に抑制する。
        # rubocop:disable Rails/LexicallyScopedActionFilter
        before_action :authenticate_api_v1_user!, only: [:update]
        # rubocop:enable Rails/LexicallyScopedActionFilter

        # パスワードリセットメール送信成功時のレスポンス
        def render_create_success
          render json: {
            status: "success",
            message: I18n.t("api.v1.auth.passwords.create_success")
          }
        end

        # DeviseTokenAuth の create をオーバーライドして redirect_url を sanitize
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

        # パスワードリセットメール送信失敗時のレスポンス
        def render_create_error
          render json: {
            status: "error",
            errors: resource_errors[:full_messages].presence || [I18n.t("api.v1.auth.error.passwords.create")]
          }, status: :unprocessable_content
        end

        # パスワード変更成功時のレスポンス
        def render_update_success
          render json: {
            status: "success",
            message: I18n.t("api.v1.auth.passwords.update_success"),
            data: resource_data
          }
        end

        # パスワード変更失敗時のレスポンス
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
