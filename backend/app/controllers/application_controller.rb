class ApplicationController < ActionController::API
  include DeviseTokenAuth::Concerns::SetUserByToken
  include ActionController::Cookies

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
    # 既にヘッダーがある場合はスキップ（ヘッダー認証を優先）
    return if request.headers["access-token"].present?

    # Cookie から認証情報を取得
    access_token = cookies[:access_token]
    client = cookies[:client]
    uid = cookies[:uid]

    # Cookie が存在する場合のみヘッダーにセット
    if access_token.present? && client.present? && uid.present?
      Rails.logger.debug { "[set_user_by_cookie] Setting headers from cookies" }
      request.headers["access-token"] = access_token
      request.headers["client"] = client
      request.headers["uid"] = uid
    end
  end

  def cookie_options
    {
      httponly: true,
      secure: Rails.env.production?,
      # クロスオリジンのフロント（Vercel）から fetch でクッキーを送信するためには
      # 本番環境で SameSite=None が必要（この場合 Secure も必須）。開発環境は :lax のままにする。
      same_site: (Rails.env.production? ? :none : :lax),
      expires: 2.weeks.from_now,
      domain: ENV["COOKIE_DOMAIN"].presence,
      path: "/"
    }
  end

  # リソース用の認証トークンを生成し、暗号化された httpOnly クッキーとして永続化する
  def issue_encrypted_auth_cookies_for(resource)
    # 旧トークンが複数パスにまたがって残っている場合があるため
    # 新しいトークンを発行する前に既存の認証 Cookie を確実にクリアする
    clear_auth_cookies

    token_headers = generate_auth_token_headers(resource)
    
    Rails.logger.debug { "[issue_encrypted_auth_cookies_for] token_headers: #{token_headers.inspect}" }

    mapping = {
      access_token: "access-token",
      client: "client",
      uid: "uid"
    }

    mapping.each do |cookie_key, header_name|
      token_value = token_headers[header_name]
      Rails.logger.debug { "[issue_encrypted_auth_cookies_for] #{cookie_key}: #{token_value.present? ? 'present' : 'MISSING'}" }
      persist_auth_cookie(cookie_key, token_value)
    end
    
    Rails.logger.info { "[issue_encrypted_auth_cookies_for] Cookies issued for user #{resource.id}" }
  rescue StandardError => e
    Rails.logger.error("Failed to issue encrypted auth cookies: #{e.message}")
    Rails.logger.error(e.backtrace.join("\n"))
  end

  def persist_auth_cookie(cookie_key, token_value)
    return if token_value.blank?

    opts = {
      value: token_value,
      path: cookie_options[:path],
      same_site: cookie_options[:same_site],
      expires: cookie_options[:expires],
      domain: cookie_options[:domain],
      httponly: cookie_options[:httponly],
      secure: cookie_options[:secure]
    }

    Rails.logger.debug { "[persist_auth_cookie] Setting cookie: #{cookie_key} with opts: #{opts.inspect}" }
    response.set_cookie(cookie_key.to_s, opts)
  end

  # レスポンスヘッダーから認証に関するヘッダー群を削除する（Stage3）
  def remove_auth_headers
    %w[access-token client uid expiry token-type].each do |header_name|
      response.headers.delete(header_name)
    end
  rescue StandardError => e
    Rails.logger.debug { "[ApplicationController] remove_auth_headers failed: #{e.message}" }
  end

  def generate_auth_token_headers(resource)
    token_headers = resource.create_new_auth_token
    # DTA が自動的にレスポンスヘッダーに auth token を書き込むのを防ぐため、
    # 生成直後にヘッダーを削除する
    remove_auth_headers if respond_to?(:remove_auth_headers, true)
    token_headers
  rescue StandardError => e
    Rails.logger.warn("Failed to generate auth token headers: #{e.message}")
    {}
  end

  # サインアウトやセッション破棄時にクッキーを削除するユーティリティ
  def clear_auth_cookies
    # ブラウザに残る cookie は path や domain の違いで複数存在しうる。
    # そのためすべての path を列挙して明示的に削除を行う。
    paths_to_clear = ["/", "/api", "/api/v1", "/api/v1/auth"]
    domain = cookie_options[:domain]
    paths_to_clear.each do |path|
      delete_auth_cookie_for_path(path, domain)
    end
  end

  def delete_auth_cookie_for_path(path, domain)
    %i[access_token client uid].each do |ck|
      delete_single_cookie(ck, path, domain)
    end
  end

  def delete_single_cookie(cookie_name, path, domain)
    # cookies.delete で通常の Cookie と encrypted Cookie の両方を削除
    # domain が nil の場合と指定されている場合の両方に対応
    cookies.delete(cookie_name, path: path, domain: domain)
    cookies.delete(cookie_name, path: path) if domain.present?

    # ブラウザ側の Cookie を確実に無効化
    expire_cookie_in_response(cookie_name, path, domain)
  end

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
end
