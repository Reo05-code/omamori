# config/initializers/cors.rb

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    # 許可するオリジンを定義
    # 本番環境: 環境変数 FRONTEND_URL に実際のドメインを設定 (例: https://myapp.com)
    # 開発環境: 環境変数がない場合は localhost:3000 をデフォルトとする
    allowed_origins = ENV.fetch("FRONTEND_URL", "http://localhost:3000")

    # もし複数のドメイン（ステージングと本番など）を許可したい場合は、
    # 環境変数をカンマ区切りにして配列化することを推奨します。
    allowed = ENV.fetch("FRONTEND_URLS", ENV.fetch("FRONTEND_URL", "http://localhost:3000"))
    allowed = allowed.split(",").map(&:strip)

    origins(*allowed)

    resource "*",
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options, :head],
      credentials: true
  end
end
