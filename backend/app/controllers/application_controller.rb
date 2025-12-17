class ApplicationController < ActionController::API
  include DeviseTokenAuth::Concerns::SetUserByToken
  include AuthCookieHelper

  # API-only: Wardenのセッション使用を無効化
  before_action :skip_session_storage

  # Origin/Referer チェック
  before_action :verify_origin!

  # Cookie から認証情報を読み取り、ヘッダーにセット（DTA が読み取れるようにする）
  before_action :set_user_by_cookie!

  # レスポンスの認証ヘッダーを削除して Cookie-only に段階移行する
  # テスト環境ではヘッダー削除を行わない（既存のテストはヘッダー可視性に依存する場合があるため）
  after_action :remove_auth_headers unless Rails.env.test?

  private

  # Wardenがセッションに書き込むのを防ぐ
  def skip_session_storage
    request.session_options[:skip] = true if request.respond_to?(:session_options)
  end

  def verify_origin!
    # 外部Origin/Refererを検証して不正なリクエストを拒否
    return if Rails.env.test?

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

  # Cookieから認証情報を読み取り、リクエストヘッダへセット
  def set_user_by_cookie!
    return if request.headers["access-token"].present?

    access_token, client, uid = auth_cookie_values

    Rails.logger.debug("[set_user_by_cookie] Cookie values - access_token: #{access_token.present? ? 'present' : 'missing'}, client: #{client.present? ? 'present' : 'missing'}, uid: #{uid}")

    unless [access_token, client, uid].all?(&:present?)
      Rails.logger.warn("[set_user_by_cookie] Missing cookies - access_token: #{access_token.present?}, client: #{client.present?}, uid: #{uid.present?}")
      return
    end

    assign_auth_headers(access_token, client, uid)
  end

  # Cookieの値をリクエストヘッダへ割り当てる
  def assign_auth_headers(access_token, client, uid)
    Rails.logger.debug("[set_user_by_cookie] Setting headers from cookies")
    request.headers["access-token"] = access_token
    request.headers["client"] = client
    request.headers["uid"] = uid
  end

  # DeviseTokenAuth が namespace ごとに生成する helper 名と、アプリ側で期待する current_user インターフェースを揃えるため、alias によって認証 helper を統一している
  alias current_user current_api_v1_user
  alias authenticate_user! authenticate_api_v1_user!
end
