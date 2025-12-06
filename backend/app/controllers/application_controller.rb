class ApplicationController < ActionController::API
  include DeviseTokenAuth::Concerns::SetUserByToken
  include ActionController::Cookies

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
      same_site: :lax
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

  # サインアウトやセッション破棄時にクッキーを削除するユーティリティ
  def clear_auth_cookies
    cookies.delete(:access_token)
    cookies.delete(:client)
    cookies.delete(:uid)
  end
end
