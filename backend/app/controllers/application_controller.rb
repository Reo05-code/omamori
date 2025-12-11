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

  # レスポンスの認証ヘッダーを削除して Cookie-only に段階移行する
  # テスト環境ではヘッダー削除を行わない（既存のテストはヘッダー可視性に依存する場合があるため）
  after_action :remove_auth_headers unless Rails.env.test?

  private

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

  # レスポンスヘッダーから認証に関するヘッダー群を削除する（Stage3）
  def remove_auth_headers
    %w[access-token client uid expiry token-type].each do |header_name|
      response.headers.delete(header_name)
    end
  rescue StandardError => e
    Rails.logger.debug { "[ApplicationController] remove_auth_headers failed: #{e.message}" }
  end

  def generate_auth_token_headers(resource)
    resource.create_new_auth_token
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
      response.set_cookie(
        ck.to_s,
        value: "",
        path: path,
        domain: domain,
        expires: 4.weeks.ago,
        httponly: true
      )
    end
  end

  protected

  # APIモードでは flash が存在しないため、通常の handle_unverified_request を使うと
  # request.flash= で NoMethodError が発生する可能性があります。
  # そこでオーバーライドし、APIでは flash を触らずに JSON 401 を返すようにしています。
  # 本番環境では通常通り InvalidAuthenticityToken を発生させ、安全性を確保します。

  def handle_unverified_request
    # フォージェリ保護が無効（例: テスト環境）の場合は処理を中断せず、そのままリクエストを通す。
    # これによりテストや内部クライアントが正常に動作します。
    return unless ActionController::Base.allow_forgery_protection

    # 本番環境では通常通り例外を発生させて厳格に検証。
    # 本番以外の環境では JSON 401 を返して開発時に確認しやすくする。
    raise ActionController::InvalidAuthenticityToken if Rails.env.production?

    render json: { error: "Invalid authenticity token" }, status: :unauthorized
  end
end
