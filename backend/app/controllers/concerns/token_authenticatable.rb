# frozen_string_literal: true

# DeviseTokenAuth の SetUserByToken に代わる、セッションレスな認証モジュール
module TokenAuthenticatable
  extend ActiveSupport::Concern

  private

  # トークンベース認証（セッションを使わない）
  def authenticate_token!
    return unless token_present?

    user = TokenAuthenticator.authenticate(request)
    return unless user

    @current_api_v1_user = user
    @resource = user
  end

  def token_present?
    request.headers["uid"].present? &&
      request.headers["client"].present? &&
      request.headers["access-token"].present?
  end

  # DeviseTokenAuth互換のヘルパーメソッド
  def current_api_v1_user
    @current_api_v1_user
  end

  def authenticate_api_v1_user!
    # まず認証を試行
    authenticate_token! unless @current_api_v1_user

    return if current_api_v1_user

    Rails.logger.warn("[authenticate_api_v1_user!] UNAUTHORIZED - Headers: uid=#{request.headers['uid'].present?}, client=#{request.headers['client'].present?}, access-token=#{request.headers['access-token'].present?}")
    render json: { errors: ["Unauthorized"] }, status: :unauthorized and return
  end

  def user_signed_in?
    current_api_v1_user.present?
  end
end
