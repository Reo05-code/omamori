# frozen_string_literal: true

module Api
  module V1
    module Auth
      # トークン有効性確認を処理するコントローラー
      # GET /api/v1/auth/validate_token - トークン有効性確認
      #
      # DeviseTokenAuth::TokenValidationsController を継承せず、独自実装
      # session へのアクセスを回避
      class TokenValidationsController < ApplicationController
        respond_to :json

        # クッキーをヘッダーに変換（認証検証は validate_user_token! で行う）
        before_action :set_user_by_cookie!
        before_action :validate_user_token!

        # トークン検証エンドポイント（読み取り専用）
        def validate_token
          render_validate_token_success
        end

        private

        # クッキー/ヘッダーのトークンを検証して@resourceを設定する
        def validate_user_token!
          uid, client, access_token = extract_auth_headers

          unless authenticate_with_cookies?(uid, client, access_token)
            render_validate_token_error
            return
          end

          Rails.logger.info("[validate_user_token] Authentication successful for user: #{@resource.email}")
        end

        # 実際にトークン一致・有効期限をチェックして認証可否を返す
        def authenticate_with_cookies?(uid, client, access_token)
          Rails.logger.info("[validate_user_token] headers present")
          return false unless uid && client && access_token

          @resource = find_user_by_uid(uid)
          return false unless @resource

          token_hash = fetch_token_hash(@resource, client)
          return false unless token_hash

          token_valid?(token_hash, access_token)
        end

        # リクエストから認証ヘッダ(uid, client, access-token)を抽出する
        def extract_auth_headers
          [request.headers["uid"], request.headers["client"], request.headers["access-token"]]
        end

        # uidからユーザーを検索して返す
        def find_user_by_uid(uid)
          user = User.find_by(uid: uid)
          Rails.logger.info("[validate_user_token] User not found for uid: #{uid}") unless user

          user
        end

        # ユーザーのtokensハッシュからクライアント情報を取得する
        def fetch_token_hash(resource, client)
          token_hash = resource.tokens[client]
          unless token_hash
            Rails.logger.info("[validate_user_token] No token found for client: #{client}")
            return
          end

          token_hash
        end

        # 保存されているハッシュと受け取ったトークンの一致・有効期限を検証する
        def token_valid?(token_hash, access_token)
          return false unless BCrypt::Password.new(token_hash["token"]).is_password?(access_token)
          return false if token_hash["expiry"] && Time.zone.at(token_hash["expiry"].to_i) < Time.current

          true
        end

        # トークン検証成功レスポンスを返す
        def render_validate_token_success
          render json: {
            status: "success",
            data: @resource.as_json(except: %i[tokens created_at updated_at])
          }
        end

        # トークン検証失敗レスポンスを返す（401）
        def render_validate_token_error
          render json: {
            status: "error",
            errors: [I18n.t("api.v1.auth.error.token_validations.invalid_token")]
          }, status: :unauthorized
        end
      end
    end
  end
end
