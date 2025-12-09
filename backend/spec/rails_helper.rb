# This file is copied to spec/ when you run 'rails generate rspec:install'
require "spec_helper"
ENV["RAILS_ENV"] ||= "test"
require_relative "../config/environment"

# 本番環境で実行されないようにガード
abort("The Rails environment is running in production mode!") if Rails.env.production?
require "rspec/rails"

# spec/support 配下のファイルを自動読み込み（設定ファイル分割用）
Rails.root.glob("spec/support/**/*.rb").each { |f| require f }

# 保留中のマイグレーションがあればテスト実行前に適用する
begin
  ActiveRecord::Migration.maintain_test_schema!
rescue ActiveRecord::PendingMigrationError => e
  abort e.to_s.strip
end

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

  # CSRF ヘルパーを request spec で利用可能にする
  config.include CsrfHelpers, type: :request

  # ファイルの配置場所からスペックのタイプ（model, request等）を自動推論する
  config.infer_spec_type_from_file_location!

  # ActionMailerの配信設定を各テスト前に初期化（CI環境でのフレーク防止）
  config.before do
    ActionMailer::Base.deliveries.clear
    ActionMailer::Base.perform_deliveries = true
  end
end
