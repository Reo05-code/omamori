# frozen_string_literal: true

module Api
  module V1
    module Auth
      # パスワードリセットを処理するコントローラー
      # POST /api/v1/auth/password - パスワード再設定メール送信
      # PUT /api/v1/auth/password - パスワード変更
      class PasswordsController < DeviseTokenAuth::PasswordsController
        respond_to :json

        # パスワードリセット関連のエンドポイントで CSRF 検証をスキップ
        # 注意: 開発用の限定的な対応。将来的にはフロント側で CSRF トークンを取得して送信する。
        # rubocop:disable Rails/LexicallyScopedActionFilter
        begin
          skip_before_action :verify_authenticity_token, only: %i[create update]
        rescue ArgumentError => e
          Rails.logger.debug do
            "[PasswordsController] verify_authenticity_token not defined, skip_before_action ignored: #{e.message}"
          end
        end
        # rubocop:enable Rails/LexicallyScopedActionFilter

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
