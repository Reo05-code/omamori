module AuthCookieHelper
  extend ActiveSupport::Concern

  included do
    include ActionController::Cookies
  end

  # Cookie オプションを返す
  def cookie_options
    {
      httponly: true,
      secure: Rails.env.production?,
      same_site: (Rails.env.production? ? :none : :lax),
      expires: 2.weeks.from_now,
      domain: ENV["COOKIE_DOMAIN"].presence,
      path: "/"
    }
  end

  # 与えられたトークンを永続化用Cookieとしてレスポンスにセットする
  def persist_auth_cookie(cookie_key, token_value)
    return if token_value.blank?

    opts = cookie_opts_for(token_value)
    Rails.logger.debug("[persist_auth_cookie] Setting cookie")
    response.set_cookie(cookie_key.to_s, opts)
  end

  # 指定トークン値からCookie設定オプションを組み立てる
  def cookie_opts_for(token_value)
    {
      value: token_value,
      path: cookie_options[:path],
      same_site: cookie_options[:same_site],
      expires: cookie_options[:expires],
      domain: cookie_options[:domain],
      httponly: cookie_options[:httponly],
      secure: cookie_options[:secure]
    }
  end

  # リソース用の認証トークンを生成し、Cookie に永続化する
  def issue_encrypted_auth_cookies_for(resource)
    clear_auth_cookies

    token_headers = generate_auth_token_headers(resource)

    mapping = {
      access_token: "access-token",
      client: "client",
      uid: "uid"
    }

    mapping.each do |cookie_key, header_name|
      token_value = token_headers[header_name]
      persist_auth_cookie(cookie_key, token_value)
    end

    Rails.logger.info { "[issue_encrypted_auth_cookies_for] Cookies issued for user #{resource.id}" }
  rescue StandardError => e
    Rails.logger.error("Failed to issue encrypted auth cookies: #{e.message}")
    Rails.logger.error(e.backtrace.join("\n"))
  end

  # リソースから認証ヘッダーを生成し、レスポンスヘッダーを消す
  def generate_auth_token_headers(resource)
    token_headers = resource.create_new_auth_token
    remove_auth_headers if respond_to?(:remove_auth_headers, true)
    token_headers
  rescue StandardError => e
    Rails.logger.warn("Failed to generate auth token headers: #{e.message}")
    {}
  end

  # レスポンスに含まれる認証関連ヘッダーを削除する
  def remove_auth_headers
    %w[access-token client uid expiry token-type].each do |header_name|
      response.headers.delete(header_name)
    end
  rescue StandardError => e
    Rails.logger.debug { "[AuthCookieHelper] remove_auth_headers failed: #{e.message}" }
  end

  # すべての認証Cookieを複数パスに渡って削除する
  def clear_auth_cookies
    paths_to_clear = ["/", "/api", "/api/v1", "/api/v1/auth"]
    domain = cookie_options[:domain]
    paths_to_clear.each do |path|
      delete_auth_cookie_for_path(path, domain)
    end
  end

  # 指定パス/ドメインで認証Cookieを削除する（ヘッダー側もexpire）
  def delete_auth_cookie_for_path(path, domain)
    %i[access_token client uid].each do |ck|
      delete_single_cookie(ck, path, domain)
    end
  end

  # 単一のCookie削除処理（domain付き/なし両方へ対応）
  def delete_single_cookie(cookie_name, path, domain)
    cookies.delete(cookie_name, path: path, domain: domain)
    cookies.delete(cookie_name, path: path) if domain.present?
    expire_cookie_in_response(cookie_name, path, domain)
  end

  # レスポンスに明示的な期限切れCookieを書き込んでブラウザ側でも削除させる
  def expire_cookie_in_response(cookie_name, path, domain)
    opts = {
      value: "",
      path: path,
      domain: domain,
      expires: 4.weeks.ago,
      httponly: cookie_options[:httponly],
      secure: cookie_options[:secure],
      same_site: cookie_options[:same_site]
    }

    response.set_cookie(cookie_name.to_s, opts)
  end

  # 認証Cookieの(access_token, client, uid)を配列で返す
  def auth_cookie_values
    [cookies[:access_token], cookies[:client], cookies[:uid]]
  end
end
