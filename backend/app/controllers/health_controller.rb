class HealthController < ApplicationController
  def index
    render json: {
      status: "ok",
      timestamp: Time.current,
      environment: Rails.env
    }
  end
end
