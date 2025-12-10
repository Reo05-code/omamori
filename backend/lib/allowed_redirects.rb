# frozen_string_literal: true

# ホワイトリストとサニタイズヘルパー
# Open Redirect を防ぐために、redirect_url のホストが許可されたものか判定
module AllowedRedirects
  module_function

  def allowed_hosts
    ENV.fetch('ALLOWED_REDIRECT_HOSTS', '').to_s.split(',').map(&:strip).reject(&:empty?)
  end

  def default_url
    ENV.fetch('FRONTEND_BASE_URL', 'http://localhost:3000')
  end

  # 与えられた raw_url を解析し、ホワイトリストに合致すれば元の URL を返す
  # 合致しない・解析できない場合は default_url を返す
  def sanitize(raw_url)
    return default_url unless raw_url.present?

    begin
      uri = URI.parse(raw_url)

      # URI が相対パスの場合はフォールバック、次のような攻撃される
      # /attack → メールリンクにそのまま入るとアウト
      return default_url unless uri.host

      host = uri.host.downcase
      port = uri.port

      host_with_port = port && !default_port_for_scheme?(uri.scheme, port) ? "#{host}:#{port}" : host

      # 比較対象としてホワイトリストの各エントリを正規化して比較
      allowed = allowed_hosts.any? do |entry|
        begin
          e = URI.parse(entry =~ %r{^https?://} ? entry : "//#{entry}")
          e_host = e.host.to_s.downcase
          e_port = e.port
          compare_with_port = e_port && !default_port_for_scheme?(e.scheme || uri.scheme, e_port) ? "#{e_host}:#{e_port}" : e_host
          compare_with_port == host_with_port || e_host == host
        rescue URI::InvalidURIError
          false
        end
      end

      return uri.to_s if allowed
    rescue URI::InvalidURIError
    end

    default_url
  end

  # 標準ポートかを判定する
  def default_port_for_scheme?(scheme, port)
    return false unless scheme
    (scheme == 'https' && port == 443) || (scheme == 'http' && port == 80)
  end
end
