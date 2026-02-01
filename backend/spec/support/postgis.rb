# frozen_string_literal: true

# PostGIS型の初期化設定
# テスト環境でPostGIS geometry/geography型を正しく扱えるようにする

RSpec.configure do |config|
  config.before(:suite) do
    # PostGIS型をActiveRecordに登録
    # unknown OID エラーを防ぐため、接続時に型情報をロード
    ActiveRecord::Base.connection.tap do |conn|
      # activerecord-postgis-adapterの型登録を強制実行
      conn.set_type_map_for_postgis if conn.respond_to?(:set_type_map_for_postgis)

      # PostGIS型のOIDをロード
      begin
        conn.execute("SELECT 'POINT(0 0)'::geometry")
        conn.execute("SELECT 'POINT(0 0)'::geography")
      rescue StandardError => e
        Rails.logger.warn "PostGIS initialization warning: #{e.message}"
      end

      # 型マッピングを再ロード
      conn.reload_type_map if conn.respond_to?(:reload_type_map)
    end
  end
end
