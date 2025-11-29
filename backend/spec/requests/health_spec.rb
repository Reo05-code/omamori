require "rails_helper"

RSpec.describe "Health" do
  describe "GET /health" do
    it "returns ok status" do
      get "/health"

      expect(response).to have_http_status(:ok)

      json = response.parsed_body
      expect(json["status"]).to eq("ok")
      expect(json).to have_key("environment")
      expect(json).to have_key("timestamp")
    end
  end
end
