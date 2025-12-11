require "active_support/core_ext/integer/time"

Rails.application.configure do
  # Settings specified here will take precedence over those in config/application.rb.

  # While tests run files are not watched, reloading is not necessary.
  config.enable_reloading = false

  # Eager loading loads your entire application. When running a single test locally,
  # this is usually not necessary, and can slow down your test suite. However, it's
  # recommended that you enable it in continuous integration systems to ensure eager
  # loading is working properly before deploying your code.
  # Devise/DeviseTokenAuth との互換性問題のため、テスト環境では常に無効化
  config.eager_load = false

  # Configure public file server for tests with Cache-Control for performance.
  config.public_file_server.enabled = true
  config.public_file_server.headers = {
    "Cache-Control" => "public, max-age=#{1.hour.to_i}"
  }

  # Show full error reports and disable caching.
  config.consider_all_requests_local = true
  config.action_controller.perform_caching = false
  config.cache_store = :null_store

  # Render exception templates for rescuable exceptions and raise for other exceptions.
  # CI環境では例外を発生させる
  config.action_dispatch.show_exceptions = ENV["CI"].present? ? :none : :rescuable

  # テスト環境ではCSRF保護を無効化
  # RSpecテストではCSRFトークンを送信しないため、false に設定
  # 本番環境・開発環境では ApplicationController の protect_from_forgery が有効
  config.action_controller.allow_forgery_protection = false

  # Configure mailer for test environment
  config.action_mailer.delivery_method = :test
  config.action_mailer.default_url_options = { host: "localhost", port: 3001 }

  # テスト環境でセッションストアを有効化
  # Devise（bypass_sign_in）はセッションに書き込みを行う。
  # API専用アプリではデフォルトでセッションが無効化されているため、
  # DisabledSessionError を避けるためにテスト時のみ Cookie ベースのセッションストアを有効にする。
  config.session_store :cookie_store, key: "_omamori_test_session"
  config.middleware.use ActionDispatch::Session::CookieStore, config.session_options

  # Disable host authorization in test environment
  config.action_dispatch.hosts_response_app = nil
  config.hosts.clear

  # Print deprecation notices to the stderr.
  config.active_support.deprecation = :stderr

  # Raise exceptions for disallowed deprecations.
  config.active_support.disallowed_deprecation = :raise

  # Tell Active Support which deprecation messages to disallow.
  config.active_support.disallowed_deprecation_warnings = []

  # Raises error for missing translations.
  # config.i18n.raise_on_missing_translations = true

  # Annotate rendered view with file names.
  # config.action_view.annotate_rendered_view_with_filenames = true
end
