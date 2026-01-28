# config/initializers/cors.rb

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    # 許可するオリジンを厳密に定義（スキーム補完禁止）
    allowed = [
      "http://localhost:3000",
      "https://omamori-three.vercel.app"
    ]

    # 末尾スラッシュのみ削除
    normalized = allowed.map { |o| o.chomp("/") }

    # デバッグ用: 許可されているオリジンをログ出力
    Rails.logger.info "[CORS] Allowed origins: #{normalized.inspect}"

    origins(*normalized)

    resource "*",
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options, :head],
      credentials: true,
      expose: [
        "access-token", "client", "uid", "expiry", "token-type",
        "X-Total-Count", "X-Total-Pages", "X-Per-Page", "X-Current-Page"
      ]
  end
end
