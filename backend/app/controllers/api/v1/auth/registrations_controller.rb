# frozen_string_literal: true

module Api
  module V1
    module Auth
      # ユーザー登録を処理するコントローラー
      # POST /api/v1/auth - ユーザー登録
      # PUT /api/v1/auth - ユーザー情報更新
      # DELETE /api/v1/auth - アカウント削除
      class RegistrationsController < DeviseTokenAuth::RegistrationsController
        respond_to :json

        before_action :authenticate_user!, only: [:update, :destroy]

        private

        # 登録時に許可するパラメータ
        def sign_up_params
          params.permit(:email, :password, :password_confirmation, :name, :phone_number)
        end

        # 更新時に許可するパラメータ
        def account_update_params
          params.permit(:email, :password, :password_confirmation, :name, :phone_number, :avatar_url)
        end

        protected

        # 登録成功時のレスポンス
        def render_create_success
          render json: {
            status: "success",
            message: "ユーザー登録が完了しました",
            data: resource_data(resource_json: @resource.as_json)
          }
        end

        # 登録失敗時のレスポンス
        def render_create_error
          render json: {
            status: "error",
            errors: resource_errors[:full_messages]
          }, status: :unprocessable_entity
        end

        # 更新成功時のレスポンス
        def render_update_success
          render json: {
            status: "success",
            message: "ユーザー情報を更新しました",
            data: resource_data
          }
        end

        # 更新失敗時のレスポンス
        def render_update_error
          render json: {
            status: "error",
            errors: resource_errors[:full_messages]
          }, status: :unprocessable_entity
        end

        # アカウント削除成功時のレスポンス
        def render_destroy_success
          render json: {
            status: "success",
            message: "アカウントを削除しました"
          }
        end

        # アカウント削除失敗時のレスポンス
        def render_destroy_error
          render json: {
            status: "error",
            errors: ["アカウントの削除に失敗しました"]
          }, status: :unprocessable_entity
        end
      end
    end
  end
end
