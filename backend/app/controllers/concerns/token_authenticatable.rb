# frozen_string_literal: true

# DeviseTokenAuth の SetUserByToken に代わる、セッションレスな認証モジュール
module TokenAuthenticatable
  extend ActiveSupport::Concern

  private

  # トークンベース認証（セッションを使わない）
  def authenticate_token!
    return unless token_present?

    uid = request.headers["uid"]
    client = request.headers["client"]
    access_token = request.headers["access-token"]

    return unless uid && client && access_token

    user = User.find_by(uid: uid)
    return unless user

    # トークンの検証
    token_data = user.tokens[client]
    return unless token_data

    # BCryptでトークンを検証
    return unless BCrypt::Password.new(token_data["token"]).is_password?(access_token)

    # 有効期限チェック
    expiry = token_data["expiry"]
    return if expiry && Time.zone.at(expiry.to_i) < Time.current

    # 認証成功：インスタンス変数にセット（セッションは使わない）
    @current_api_v1_user = user
    @resource = user
  rescue StandardError => e
    Rails.logger.error("[TokenAuthenticatable] Error: #{e.message}")
    nil
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

    unless current_api_v1_user
      render json: { errors: ["Unauthorized"] }, status: :unauthorized and return
    end
  end

  def user_signed_in?
    current_api_v1_user.present?
  end
end
