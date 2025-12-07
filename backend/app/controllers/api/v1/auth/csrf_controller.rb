# frozen_string_literal: true
module Api
  module V1
    module Auth
      # SPA クライアント向けに CSRF トークンを提供するエンドポイント
      # GET /api/v1/auth/csrf
      class CsrfController < ApplicationController
        # レスポンスは JSON 形式で返し、JS から読み取れる `XSRF-TOKEN` クッキー
        #（httponly: false）も同時にセットします。フロントは取得したトークン
        # を `X-CSRF-Token` ヘッダに入れて変更系リクエストを送信します。
        respond_to :json

        # 認証前にもトークンが必要となるため、このエンドポイントは認証不要です。
        protect_from_forgery with: :exception

        def show
          token = form_authenticity_token

          # フロントが参照できるクッキーをセットしておく（httponly: false）。
          # `secure` は本番環境では true にします。
          cookies[:"XSRF-TOKEN"] = {
            value: token,
            httponly: false,
            secure: Rails.env.production?,
            same_site: :lax,
            domain: cookie_options[:domain]
          }

          render json: { csrf_token: token }
        end
      end
    end
  end
end
