class ApplicationController < ActionController::API
  include ActionController::RequestForgeryProtection
  include DeviseTokenAuth::Concerns::SetUserByToken
  include ActionController::Cookies

  # CSRF保護を環境ごとに設定
  # テスト環境: protect_from_forgery を呼ばない（config/environments/test.rb で allow_forgery_protection = false）
  # 本番環境: exception（不正リクエストをブロック、より安全）
  # 開発環境: null_session（API互換、curlでのテストが容易）
  unless Rails.env.test?
    protect_from_forgery with: Rails.env.production? ? :exception : :null_session
  end

  # リクエストが来たら、クッキーからヘッダーへ転記
  prepend_before_action :copy_auth_cookies_to_headers

  # レスポンスを返す前に、ヘッダーからクッキーへ転記
  # 今までヘッダー付与される前にコピーされてた。これを修正
  # NOTE: DeviseTokenAuth は内部で after_action(:update_auth_header) を使って
  # レスポンスヘッダーにトークンを書き込みます。after_action の実行順序は逆になるため、ここでは prepend してチェーンの先頭に差し込み、
  # 結果的に DeviseTokenAuth の after_action の後に実行されるようにします。
  prepend_after_action :set_auth_cookies_from_headers

  private

  # リクエスト処理前: Cookie -> Request Headers
  def copy_auth_cookies_to_headers
    return unless cookies.encrypted[:access_token]

    # request.headers[...] を使うのがより確実
    mapping = {
      "access-token" => :access_token,
      "client" => :client,
      "uid" => :uid
    }

    mapping.each do |header_name, cookie_key|
      request.headers[header_name] ||= cookies.encrypted[cookie_key]
    end
  rescue StandardError => e
    Rails.logger.warn("Failed to copy auth cookies to headers: #{e.message}")
  end

  # リクエスト処理後: Response Headers -> Cookie
  # トークンがローテーションされた場合、新しいトークンをクッキーに保存し直す
  def set_auth_cookies_from_headers
    return if response.headers["access-token"].blank?

    write_and_cleanup_auth_cookies
  end

  def write_and_cleanup_auth_cookies
    Rails.logger.debug("[ApplicationController] set_auth_cookies_from_headers: start")
    Rails.logger.debug do
      "[ApplicationController] response.headers['access-token']: #{response.headers['access-token']}"
    end
    Rails.logger.debug("[ApplicationController] writing encrypted cookies...")
    write_encrypted_cookies_from_headers
    Rails.logger.debug("[ApplicationController] cookies written")

    # セキュリティのため、レスポンスヘッダーからは削除してクライアントに見せない
    %w[access-token client uid expiry].each { |h| response.headers.delete(h) }
  end

  def cookie_options
    {
      httponly: true,
      secure: Rails.env.production?,
      same_site: :lax,
      expires: 2.weeks.from_now
    }
  end

  def write_encrypted_cookies_from_headers
    mapping = {
      access_token: "access-token",
      client: "client",
      uid: "uid"
    }

    mapping.each do |cookie_key, header_name|
      cookies.encrypted[cookie_key] = cookie_options.merge(value: response.headers[header_name])
    end
  end

  # リソース用の認証トークンを生成し、暗号化された httpOnly クッキーとして永続化する
  def issue_encrypted_auth_cookies_for(resource)
    token_headers = generate_auth_token_headers(resource)

    mapping = {
      access_token: "access-token",
      client: "client",
      uid: "uid"
    }

    mapping.each do |cookie_key, header_name|
      persist_auth_cookie(cookie_key, token_headers[header_name])
    end
  rescue StandardError => e
    Rails.logger.warn("Failed to issue encrypted auth cookies: #{e.message}")
  end

  def persist_auth_cookie(cookie_key, token_value)
    cookies.encrypted[cookie_key] = cookie_options.merge(value: token_value)

    # テスト環境の RSpec では encrypted cookies が response.cookies で見えないため、
    # レスポンスにも明示的にセットしてテストから確認できるようにする。
    return unless respond_to?(:response)

    response.set_cookie(
      cookie_key.to_s,
      cookie_options.merge(value: token_value)
    )
  end

  def generate_auth_token_headers(resource)
    resource.create_new_auth_token
  rescue StandardError => e
    Rails.logger.warn("Failed to generate auth token headers: #{e.message}")
    {}
  end

  # ステージ2の CSRF Cookie 機能が有効な場合、フロントで読み取れる XSRF-TOKEN を発行する
  def issue_xsrf_cookie_if_enabled
    return unless ENV["ENABLE_STAGE2_CSRF"] == "true"

    # form_authenticity_token を呼ぶと session 内に token が自動生成される
    token = form_authenticity_token

    # フロントで読み取るため httponly: false にし、共通オプションに expires を含める
    cookies["XSRF-TOKEN"] = cookie_options.merge(value: token, httponly: false)
  end

  # サインアウトやセッション破棄時にクッキーを削除するユーティリティ
  def clear_auth_cookies
    cookies.delete(:access_token)
    cookies.delete(:client)
    cookies.delete(:uid)
  end
end
