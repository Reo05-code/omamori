require "active_support/core_ext/integer/time"

Rails.application.configure do
  # Settings specified here will take precedence over those in config/application.rb.

  # In the development environment your application's code is reloaded any time
  # it changes. This slows down response time but is perfect for development
  # since you don't have to restart the web server when you make code changes.
  config.enable_reloading = true

  # Do not eager load code on boot.
  config.eager_load = false

  # Show full error reports.
  config.consider_all_requests_local = true

  # Enable server timing
  config.server_timing = true

  # Enable/disable caching. By default caching is disabled.
  # Run rails dev:cache to toggle caching.
  if Rails.root.join("tmp/caching-dev.txt").exist?
    config.cache_store = :memory_store
    config.public_file_server.headers = {
      "Cache-Control" => "public, max-age=#{2.days.to_i}"
    }
  else
    config.action_controller.perform_caching = false

    config.cache_store = :null_store
  end

  # Print deprecation notices to the Rails logger.
  config.active_support.deprecation = :log

  # Raise exceptions for disallowed deprecations.
  config.active_support.disallowed_deprecation = :raise

  # Tell Active Support which deprecation messages to disallow.
  config.active_support.disallowed_deprecation_warnings = []

  # Raise an error on page load if there are pending migrations.
  config.active_record.migration_error = :page_load

  # Highlight code that triggered database queries in logs.
  config.active_record.verbose_query_logs = true

  # Raises error for missing translations.
  # config.i18n.raise_on_missing_translations = true

  # Annotate rendered view with file names.
  # config.action_view.annotate_rendered_view_with_filenames = true

# メール設定（必須）
  # `FRONTEND_BASE_URL` が設定されていれば、そのホスト/ポートを使用して
  # メール内のリンクを組み立てる。なければローカルの `localhost:3000` を使用。
  if ENV['FRONTEND_BASE_URL'].present?
    require 'uri'
    begin
      uri = URI.parse(ENV['FRONTEND_BASE_URL'])
      host = uri.host || 'localhost'
      port = uri.port || 3000
      protocol = uri.scheme
      config.action_mailer.default_url_options = { host: host, port: port, protocol: protocol }
    rescue URI::InvalidURIError
      config.action_mailer.default_url_options = { host: 'localhost', port: 3000 }
    end
  else
    config.action_mailer.default_url_options = { host: 'localhost', port: 3000 }
  end

  # 開発メール送信: letter_opener を使ってブラウザでメールを開く
  config.action_mailer.delivery_method = :letter_opener

  # 開発では配信とエラーを有効にしてデバッグしやすくする
  config.action_mailer.perform_deliveries = true
  config.action_mailer.raise_delivery_errors = true

    # 開発メール送信: 通常は `letter_opener` を使ってブラウザでメールを開く。
    # ただし Docker コンテナ内では Launchy がブラウザを見つけられず例外になるため、
    # コンテナ検出時はファイル書き出しモードにフォールバック。
    if File.exist?("/.dockerenv")
      # コンテナ内ではメールを HTML ファイルとして出力する（tmp/letter_opener に保存）
      config.action_mailer.delivery_method = :file
      config.action_mailer.file_settings = { location: Rails.root.join('tmp', 'letter_opener').to_s }
    else
      # ローカル開発環境では letter_opener を使用してブラウザで開く
      config.action_mailer.delivery_method = :letter_opener
    end
end
