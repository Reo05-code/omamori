# config/initializers/cors.rb

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    # 許可するオリジンを定義
    # 本番環境: 環境変数 FRONTEND_URL に実際のドメインを設定 (例: https://myapp.com)
    # 開発環境: 環境変数がない場合は localhost:3000 をデフォルトとする
    
    # もし複数のドメイン（ステージングと本番など）を許可したい場合は、
    # 環境変数をカンマ区切りにして配列化することを推奨します。
    allowed = ENV.fetch("FRONTEND_URLS", ENV.fetch("FRONTEND_URL", "http://localhost:3000"))
    allowed = allowed.split(",").map(&:strip)

    # 本番環境で環境変数が未設定の場合の安全策として Vercel のデフォルトドメインを追加
    # (環境変数が正しく設定されていれば、この行は実質的に無効)
    if Rails.env.production? && !allowed.any? { |origin| origin.include?("omamori-three.vercel.app") }
      allowed << "https://omamori-three.vercel.app"
    end

    # デバッグ用: 許可されているオリジンをログ出力
    Rails.logger.info "[CORS] Allowed origins: #{allowed.inspect}"

    origins(*allowed)

    resource "*",
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options, :head],
      credentials: true
  end
end
