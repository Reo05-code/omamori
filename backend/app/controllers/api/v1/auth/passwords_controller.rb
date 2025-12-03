# frozen_string_literal: true

module Api
  module V1
    module Auth
      # パスワードリセットを処理するコントローラー
      # POST /api/v1/auth/password - パスワード再設定メール送信
      # PUT /api/v1/auth/password - パスワード変更
      class PasswordsController < DeviseTokenAuth::PasswordsController
        respond_to :json

        before_action :authenticate_user!, only: [:update]

        # パスワードリセットメール送信成功時のレスポンス
        def render_create_success
          render json: {
            status: "success",
            message: "パスワード再設定用のメールを送信しました"
          }
        end

        # パスワードリセットメール送信失敗時のレスポンス
        def render_create_error
          render json: {
            status: "error",
            errors: resource_errors[:full_messages]
          }, status: :unprocessable_entity
        end

        # パスワード変更成功時のレスポンス
        def render_update_success
          render json: {
            status: "success",
            message: "パスワードを変更しました",
            data: resource_data
          }
        end

        # パスワード変更失敗時のレスポンス
        def render_update_error
          render json: {
            status: "error",
            errors: resource_errors[:full_messages]
          }, status: :unprocessable_entity
        end
      end
    end
  end
end
