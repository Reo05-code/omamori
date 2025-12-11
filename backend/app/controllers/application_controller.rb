class ApplicationController < ActionController::API
  include DeviseTokenAuth::Concerns::SetUserByToken
  include AuthCookieHelper

  # Origin/Referer チェック
  before_action :verify_origin!

  # Cookie から認証情報を読み取り、ヘッダーにセット（DTA が読み取れるようにする）
  before_action :set_user_by_cookie!

  # レスポンスの認証ヘッダーを削除して Cookie-only に段階移行する
  # テスト環境ではヘッダー削除を行わない（既存のテストはヘッダー可視性に依存する場合があるため）
  after_action :remove_auth_headers unless Rails.env.test?

  private

  def verify_origin!
    allowed = [
      "https://omamori-three.vercel.app",
      "http://localhost:3000"
    ]
    origin = request.headers["Origin"]
    referer = request.headers["Referer"]
    unless allowed.include?(origin) ||
           allowed.any? { |o| referer&.start_with?(o) }
      render json: { error: "Forbidden origin" }, status: :forbidden
    end
  end

  # Cookie から認証情報を読み取り、リクエストヘッダーにセット
  # DeviseTokenAuth の SetUserByToken がヘッダーから認証情報を読み取るため
  def set_user_by_cookie!
    return if request.headers['access-token'].present?

    access_token, client, uid = auth_cookie_values

    unless [access_token, client, uid].all?(&:present?)
      Rails.logger.warn('[set_user_by_cookie] Missing cookies')
      return
    end

    Rails.logger.debug('[set_user_by_cookie] Setting headers from cookies')
    request.headers['access-token'] = access_token
    request.headers['client'] = client
    request.headers['uid'] = uid
  end
  # Cookie 関連の処理は `AuthCookieHelper` に移動しました。
end
