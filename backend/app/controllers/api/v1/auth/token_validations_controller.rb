# frozen_string_literal: true

module Api
  module V1
    module Auth
      # トークン有効性確認を処理するコントローラー
      # GET /api/v1/auth/validate_token - トークン有効性確認
      class TokenValidationsController < DeviseTokenAuth::TokenValidationsController

        respond_to :json

        # トークン検証成功時のレスポンス
        def render_validate_token_success
          render json: {
            status: "success",
            data: resource_data(resource_json: @resource.as_json)
          }
        end

        # トークン検証失敗時のレスポンス
        def render_validate_token_error
          render json: {
            status: "error",
            errors: [I18n.t('api.v1.auth.error.token_validations.invalid_token')]
          }, status: :unauthorized
        end
      end
    end
  end
end
