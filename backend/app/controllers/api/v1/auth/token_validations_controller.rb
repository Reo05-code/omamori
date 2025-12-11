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

        # トークン検証（read-only: Cookie/ヘッダーの更新なし）
        def validate_token
          render_validate_token_success
        end

        private

        # クッキーまたはヘッダーからトークンを検証してユーザーを認証
        def validate_user_token!
          uid = request.headers['uid']
          client = request.headers['client']
          access_token = request.headers['access-token']

          Rails.logger.info("[validate_user_token] Headers - uid: #{uid.present?}, client: #{client.present?}, access_token: #{access_token.present?}")

          unless uid.present? && client.present? && access_token.present?
            render_validate_token_error
            return
          end

          @resource = User.find_by(uid: uid)

          unless @resource
            Rails.logger.info("[validate_user_token] User not found for uid: #{uid}")
            render_validate_token_error
            return
          end

          # DeviseTokenAuth のトークン検証
          token_hash = @resource.tokens[client]

          unless token_hash
            Rails.logger.info("[validate_user_token] No token found for client: #{client}")
            render_validate_token_error
            return
          end

          # BCrypt でトークンを検証
          unless BCrypt::Password.new(token_hash['token']).is_password?(access_token)
            Rails.logger.info("[validate_user_token] Token validation failed")
            render_validate_token_error
            return
          end

          # トークンの有効期限を確認
          if token_hash['expiry'] && Time.at(token_hash['expiry'].to_i) < Time.current
            Rails.logger.info("[validate_user_token] Token expired")
            render_validate_token_error
            return
          end

          Rails.logger.info("[validate_user_token] Authentication successful for user: #{@resource.email}")
        end

        private

        # トークン検証成功時のレスポンス
        def render_validate_token_success
          render json: {
            status: "success",
            data: @resource.as_json(except: [:tokens, :created_at, :updated_at])
          }
        end

        # トークン検証失敗時のレスポンス
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
