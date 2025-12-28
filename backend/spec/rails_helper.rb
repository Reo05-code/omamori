# This file is copied to spec/ when you run 'rails generate rspec:install'
require "spec_helper"

# docker-compose ではサービス環境変数で RAILS_ENV=development が入ることがあるため、
# RSpec 実行時は常に test を強制する
ENV["RAILS_ENV"] = "test"

# docker-compose の backend サービスは DATABASE_URL が development DB を指しているため、
# RSpec 実行時に誤って開発DBを purge しないよう test DB に差し替える
if File.exist?("/.dockerenv")
  ENV["DATABASE_URL"] = ENV.fetch("TEST_DATABASE_URL", "postgresql://postgres:postgres@db:5432/app_test")
end

require_relative "../config/environment"

# 本番環境で実行されないようにガード
abort("The Rails environment is running in production mode!") if Rails.env.production?
require "rspec/rails"

# spec/support 配下のファイルを自動読み込み（設定ファイル分割用）
Rails.root.glob("spec/support/**/*.rb").each { |f| require f }

# NOTE: `ActiveRecord::Migration.maintain_test_schema!` は schema.rb の
# geography/geometry 関数呼び出しでエラーになる環境があるため（PostGIS）
# テスト実行時の自動スキーマ読み込みはここでは行わない。
# テスト用 DB は手動でマイグレーションを適用しておいてください。
# 例: `RAILS_ENV=test bin/rails db:drop db:create db:migrate`

RSpec.configure do |config|
  # Fixtureのパス設定（FactoryBotを使うなら不要だが、一応残しておく）
  config.fixture_paths = [Rails.root.join("spec/fixtures")]

  # DatabaseCleanerを使用するため、RSpecの組み込みトランザクション機能は無効化
  config.use_transactional_fixtures = false

  # Rails gem内部のバックトレースを除外して、エラーログを見やすくする
  config.filter_rails_from_backtrace!

  # -----------------------------------------------------------
  # ▼ ここから追加・修正した設定 ▼
  # -----------------------------------------------------------

  # FactoryBotのメソッド（create, build等）をクラス名なしで使えるようにする
  config.include FactoryBot::Syntax::Methods

  # 【推奨】Deviseのテストヘルパー（sign_in 等）を使えるようにする
  # 今後の Request Spec で役立ちます
  config.include Devise::Test::IntegrationHelpers, type: :request

  # DeviseTokenAuth の認証ヘルパー（create_new_auth_token を使った認証）
  config.include DeviseTokenAuthHelpers, type: :request

  # ファイルの配置場所からスペックのタイプ（model, request等）を自動推論する
  config.infer_spec_type_from_file_location!

  # ActionMailerの配信設定を各テスト前に初期化（CI環境でのフレーク防止）
  config.before do
    ActionMailer::Base.deliveries.clear
    ActionMailer::Base.perform_deliveries = true
  end

  # Bullet をテスト中に有効にして N+1 を検出するためのフック
  if defined?(Bullet)
    config.before do
      Bullet.start_request
    end

    config.after do
      # if Bullet.notification? を消して確実に通知を届けるように変更
      Bullet.perform_out_of_channel_notifications
      Bullet.end_request
    end
  end
end ensure Bullet delivers notifications (and raises when configured)
