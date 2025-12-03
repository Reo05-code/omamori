# frozen_string_literal: true

module Api
  module V1
    module Auth
      # パスワードリセットを処理するコントローラー
      # POST /api/v1/auth/password - パスワード再設定メール送信
      # PUT /api/v1/auth/password - パスワード変更
      class PasswordsController < DeviseTokenAuth::PasswordsController
        respond_to :json

        before_action :authenticate_api_v1_user!, only: [:update]

        # パスワードリセットメール送信成功時のレスポンス
        def render_create_success
          render json: {
            status: "success",
            message: I18n.t('api.v1.auth.passwords.create_success')
          }
        end

        # パスワードリセットメール送信失敗時のレスポンス
        def render_create_error
          render json: {
            status: "error",
            errors: resource_errors[:full_messages].presence || [I18n.t('api.v1.auth.error.passwords.create')]
          }, status: :unprocessable_entity
        end

        # パスワード変更成功時のレスポンス
        def render_update_success
          render json: {
            status: "success",
            message: I18n.t('api.v1.auth.passwords.update_success'),
            data: resource_data
          }
        end

        # パスワード変更失敗時のレスポンス
        def render_update_error
          render json: {
            status: "error",
            errors: resource_errors[:full_messages].presence || [I18n.t('api.v1.auth.error.passwords.update')]
          }, status: :unprocessable_entity
        end
      end
    end
  end
end
