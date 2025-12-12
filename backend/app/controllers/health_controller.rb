class HealthController < ApplicationController
  def index
    # ヘルスチェック。稼働状況・タイムスタンプ・環境を返す
    render json: {
      status: "ok",
      timestamp: Time.current,
      environment: Rails.env
    }
  end
end
