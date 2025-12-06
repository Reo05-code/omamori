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
    request.headers["access-token"] ||= cookies.encrypted[:access_token]
    request.headers["client"] ||= cookies.encrypted[:client]
    request.headers["uid"] ||= cookies.encrypted[:uid]
  rescue StandardError => e
    Rails.logger.warn("Failed to copy auth cookies to headers: #{e.message}")
  end

  # リクエスト処理後: Response Headers -> Cookie
  # トークンがローテーションされた場合、新しいトークンをクッキーに保存し直す
  def set_auth_cookies_from_headers
    # Debug: after_action で実行されるか確認するログ
    # 目的: devise_token_auth がレスポンスヘッダーに access-token を書き込んでいるかを検証する
    Rails.logger.debug("[ApplicationController] set_auth_cookies_from_headers: start")
    Rails.logger.debug do
      "[ApplicationController] response.headers['access-token']: #{response.headers['access-token']}"
    end
    return if response.headers["access-token"].blank?

    # SessionsControllerと同じ設定にする必要があります
    cookie_options = {
      httponly: true,
      secure: Rails.env.production?,
      same_site: :lax
      # 必要であれば expires も設定
    }

    # 新しいトークン情報をクッキーに上書き
    # Debug: 実際に cookies.encrypted に書き込む前後をログで確認
    Rails.logger.debug("[ApplicationController] writing encrypted cookies...")
    cookies.encrypted[:access_token] = cookie_options.merge(value: response.headers["access-token"])
    cookies.encrypted[:client] = cookie_options.merge(value: response.headers["client"])
    cookies.encrypted[:uid] = cookie_options.merge(value: response.headers["uid"])
    Rails.logger.debug("[ApplicationController] cookies written")

    # セキュリティのため、レスポンスヘッダーからは削除してクライアントに見せない
    response.headers.delete("access-token")
    response.headers.delete("client")
    response.headers.delete("uid")
    response.headers.delete("expiry")
  end

  # サインアウトやセッション破棄時にクッキーを削除するユーティリティ
  def clear_auth_cookies
    cookies.delete(:access_token)
    cookies.delete(:client)
    cookies.delete(:uid)
  end
end
