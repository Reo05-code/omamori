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

        # API-only: CSRF保護とセッションストレージを無効化
        skip_before_action :verify_authenticity_token, raise: false

        # `update`/`destroy` は DeviseTokenAuth のスーパークラスで定義されるため
        # RuboCop の LexicallyScopedActionFilter が誤検知する。
        # 明示的に抑制する。
        # rubocop:disable Rails/LexicallyScopedActionFilter
        before_action :authenticate_api_v1_user!, only: %i[update destroy]
        # rubocop:enable Rails/LexicallyScopedActionFilter

        # DTA が自動的に Cookie をセットする処理をスキップ
        skip_after_action :update_auth_header, raise: false

        private

        # 新規登録時に許可するパラメータを返す
        def sign_up_params
          params.permit(:email, :password, :password_confirmation, :name, :phone_number)
        end

        # アカウント更新時に許可するパラメータを返す
        def account_update_params
          params.permit(:email, :password, :password_confirmation, :name, :phone_number, :avatar_url)
        end

        protected

        # 新規登録成功時にCookieを発行してサクセスレスポンスを返す
        def render_create_success
          issue_encrypted_auth_cookies_for(@resource)

          render json: {
            status: "success",
            message: I18n.t("api.v1.auth.success.registrations.create"),
            data: resource_data(resource_json: @resource.as_json)
          }
        end

        # 新規登録失敗時のエラーレスポンスを返す
        def render_create_error
          render json: {
            status: "error",
            errors: resource_errors[:full_messages].presence || [I18n.t("api.v1.auth.error.registrations.create")]
          }, status: :unprocessable_content
        end

        # アカウント更新成功時のサクセスレスポンスを返す
        def render_update_success
          render json: {
            status: "success",
            message: I18n.t("api.v1.auth.success.registrations.update"),
            data: resource_data
          }
        end

        # アカウント更新失敗時のエラーレスポンスを返す
        def render_update_error
          render json: {
            status: "error",
            errors: resource_errors[:full_messages]
          }, status: :unprocessable_content
        end

        # アカウント削除成功時のサクセスレスポンスを返す
        def render_destroy_success
          render json: {
            status: "success",
            message: I18n.t("api.v1.auth.success.registrations.destroy")
          }
        end

        # アカウント削除失敗時のエラーレスポンスを返す
        def render_destroy_error
          render json: {
            status: "error",
            errors: [I18n.t("api.v1.auth.registrations.destroy_error")]
          }, status: :unprocessable_content
        end
      end
    end
  end
end
