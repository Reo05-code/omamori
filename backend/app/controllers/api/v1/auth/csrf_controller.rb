# frozen_string_literal: true

module Api
  module V1
    module Auth
      # 廃止予定のCSRFトークンエンドポイント（互換性のため空トークンを返す）
      class CsrfController < ApplicationController
        respond_to :json

        def show
          render json: { csrf_token: "" }
        end
      end
    end
  end
end
