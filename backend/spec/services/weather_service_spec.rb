# frozen_string_literal: true

require "rails_helper"

RSpec.describe WeatherService do
  describe ".fetch_weather" do
    let(:connection) { instance_double(Faraday::Connection) }
    let(:response) { instance_double(Faraday::Response, status: 200, body: response_body) }
    let(:response_body) do
      {
        current: {
          temperature_2m: 28.5,
          weather_code: 1
        }
      }.to_json
    end

    before do
      Rails.cache.clear
      allow(Faraday).to receive(:new).and_return(connection)
      allow(connection).to receive(:get).and_return(response)
    end

    after do
      # クラスインスタンス変数をリセットしてモックのリークを防ぐ
      WeatherService.instance_variable_set(:@http_client, nil)
    end

    it "気温と天気を返す" do
      result = described_class.fetch_weather(35.0, 139.0)

      expect(result).to eq({ temp: 28.5, condition: :partly_cloudy })
    end

    it "同じ座標の連続呼び出しはキャッシュされる" do
      # テスト環境では一時的にメモリストアを使用してキャッシュをテスト
      original_store = Rails.cache
      Rails.cache = ActiveSupport::Cache::MemoryStore.new

      begin
        described_class.fetch_weather(35.0, 139.0)
        described_class.fetch_weather(35.0, 139.0)

        # APIリクエストは初回のみ
        expect(connection).to have_received(:get).once
      ensure
        Rails.cache = original_store
      end
    end

    it "APIが500を返した場合はnilを返す" do
      allow(response).to receive(:status).and_return(500)

      result = described_class.fetch_weather(35.0, 139.0)

      expect(result).to be_nil
    end

    it "タイムアウト時はnilを返す" do
      allow(connection).to receive(:get).and_raise(Faraday::TimeoutError)

      result = described_class.fetch_weather(35.0, 139.0)

      expect(result).to be_nil
    end

    it "緯度経度がない場合はnilを返す" do
      expect(described_class.fetch_weather(nil, 139.0)).to be_nil
      expect(described_class.fetch_weather(35.0, nil)).to be_nil
    end
  end
end
