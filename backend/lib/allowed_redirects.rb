# frozen_string_literal: true

# ホワイトリストとサニタイズヘルパー
# Open Redirect を防ぐために、redirect_url のホストが許可されたものか判定
module AllowedRedirects
  module_function

  def allowed_hosts
    ENV.fetch("ALLOWED_REDIRECT_HOSTS", "").to_s.split(",").map(&:strip).reject(&:empty?)
  end

  def default_url
    ENV.fetch("FRONTEND_BASE_URL", "http://localhost:3000")
  end

  # 与えられた raw_url を解析し、ホワイトリストに合致すれば元の URL を返す
  # 合致しない・解析できない場合は default_url を返す
  def sanitize(raw_url)
    return default_url if raw_url.blank?

    uri = parse_uri(raw_url)
    return default_url unless uri

    return default_url unless uri.host

    host_with_port = host_with_port_for(uri)

    return uri.to_s if host_allowed?(host_with_port, uri)

    default_url
  end

  def parse_uri(raw_url)
    URI.parse(raw_url)
  rescue URI::InvalidURIError
    nil
  end

  def host_with_port_for(uri)
    host = uri.host.downcase
    port = uri.port
    port && !default_port_for_scheme?(uri.scheme, port) ? "#{host}:#{port}" : host
  end

  def host_allowed?(host_with_port, uri)
    allowed_hosts.any? do |entry|
      entry_matches?(entry, host_with_port, uri)
    end
  end

  def entry_matches?(entry, host_with_port, uri)
    entry_uri = safe_parse_entry(entry)
    return false unless entry_uri&.host

    e_host = entry_uri.host.to_s.downcase
    e_port = entry_uri.port
    compare_with_port = if e_port && !default_port_for_scheme?(entry_uri.scheme || uri.scheme, e_port)
                          "#{e_host}:#{e_port}"
                        else
                          e_host
                        end

    compare_with_port == host_with_port || e_host == host_with_port.split(":").first
  end

  def safe_parse_entry(entry)
    URI.parse(entry =~ %r{^https?://} ? entry : "//#{entry}")
  rescue URI::InvalidURIError
    nil
  end

  # 標準ポートかを判定する
  def default_port_for_scheme?(scheme, port)
    return false unless scheme

    (scheme == "https" && port == 443) || (scheme == "http" && port == 80)
  end
end
