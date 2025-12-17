# frozen_string_literal: true

# ヘッダーからトークンを検証して User を返すサービス
class TokenAuthenticator
  # rubocop:disable Metrics/CyclomaticComplexity, Metrics/PerceivedComplexity
  def self.authenticate(request)
    uid, client, access_token = fetch_headers(request)

    user = find_user(uid) if uid
    token_data = fetch_token_data(user, client) if user

    valid_token_bool = valid_token?(token_data, access_token)
    expired = token_expired?(token_data)

    valid = uid && client && access_token && user && token_data && valid_token_bool && !expired
    return nil unless valid

    user
  rescue BCrypt::Errors::InvalidHash => e
    Rails.logger.error("[TokenAuthenticator] Invalid token hash: #{e.message}")
    nil
  end
  # rubocop:enable Metrics/CyclomaticComplexity, Metrics/PerceivedComplexity

  def self.fetch_headers(request)
    [request.headers["uid"], request.headers["client"], request.headers["access-token"]]
  end

  def self.find_user(uid)
    User.find_by(uid: uid)
  end

  def self.fetch_token_data(user, client)
    user.tokens.to_h[client]
  end

  def self.valid_token?(token_data, access_token)
    hashed = token_data["token"]
    return false if hashed.blank?

    BCrypt::Password.new(hashed).is_password?(access_token)
  end

  def self.token_expired?(token_data)
    expiry = token_data["expiry"]
    expiry && Time.zone.at(expiry.to_i) < Time.current
  end
end
