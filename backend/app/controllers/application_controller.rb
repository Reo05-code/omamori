class ApplicationController < ActionController::API
  # DeviseTokenAuth::Concerns::SetUserByToken の代わりに自作モジュールを使用
  # これによりセッション依存を完全に排除
  include TokenAuthenticatable
  include AuthCookieHelper

  # Origin/Referer チェック
  before_action :verify_origin!

  # Cookie から認証情報を読み取り、ヘッダーにセット（DTA が読み取れるようにする）
  before_action :set_user_by_cookie!
  # ヘッダーまたは Cookie から current_user を設定する（セッションを使わない）
  before_action :authenticate_token!

  # レスポンスの認証ヘッダーを削除して Cookie-only に段階移行する
  # テスト環境ではヘッダー削除を行わない（既存のテストはヘッダー可視性に依存する場合があるため）
  after_action :remove_auth_headers unless Rails.env.test?

  private

  def verify_origin!
    # test環境では常にスキップ
    return if Rails.env.test?
    # 読み取り系リクエストはCSRFの主対象ではないため許可する
    return if request.get? || request.head? || request.options?

    # 外部Origin/Refererを検証して不正なリクエストを拒否
    allowed = [
      "https://omamori-three.vercel.app",
      "http://localhost:3000",
      "http://localhost:3001"  # フロントエンド開発用
    ]
    origin = request.headers["Origin"]
    referer = request.headers["Referer"]

    # Origin または Referer が許可リストにある場合のみ通過
    return if origin.present? && allowed.include?(origin)
    return if referer.present? && allowed.any? { |o| referer.start_with?(o) }

    # どちらも一致しない場合は拒否
    render json: { error: "Forbidden origin" }, status: :forbidden
  end

  # Cookieから認証情報を読み取り、リクエストヘッダへセット
  def set_user_by_cookie!
    return if request.headers["access-token"].present?

    access_token, client, uid = auth_cookie_values

    Rails.logger.debug { "[set_user_by_cookie] Cookie values - #{auth_cookie_debug(access_token, client, uid)}" }

    unless [access_token, client, uid].all?(&:present?)
      Rails.logger.warn("[set_user_by_cookie] Missing cookies - #{auth_cookie_debug(access_token, client, uid)}")
      return
    end

    assign_auth_headers(access_token, client, uid)
    # ヘッダーをセットしたらトークン検証を行い current_user を設定する
    authenticate_token!
  end

  def auth_cookie_debug(access_token, client, uid)
    "atk: #{access_token.present? ? 'ok' : 'no'}, clt: #{client.present? ? 'ok' : 'no'}, uid: #{uid}"
  end

  # Cookieの値をリクエストヘッダへ割り当てる
  def assign_auth_headers(access_token, client, uid)
    Rails.logger.debug("[set_user_by_cookie] Setting headers from cookies")
    request.headers["access-token"] = access_token
    request.headers["client"] = client
    request.headers["uid"] = uid
  end

  # TokenAuthenticatable で current_user エイリアスが定義されていないため追加
  alias current_user current_api_v1_user
  alias authenticate_user! authenticate_api_v1_user!
end
