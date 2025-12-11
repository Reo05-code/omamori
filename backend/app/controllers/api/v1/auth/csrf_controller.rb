# frozen_string_literal: true

module Api
  module V1
    module Auth
      # CSRF トークン提供エンドポイント（廃止予定）
      # Origin/Referer チェックで CSRF 保護を実現しているため、
      # CSRF トークンは不要になりました。
      # このエンドポイントは互換性のために残していますが、
      # 実際には何もせず空のトークンを返します。
      class CsrfController < ApplicationController
        respond_to :json

        def show
          # 互換性のため空のレスポンスを返す
          render json: { csrf_token: "" }
        end
      end
    end
  end
end
