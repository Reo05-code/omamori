# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Organizations", type: :request do
  describe "GET /api/v1/organizations (一覧取得)" do
    let(:user) { create(:user) }
    let!(:organization) { create(:organization) }

    before do
      create(:membership, organization: organization, user: user)
    end

    it "現在のユーザーの所属組織を返す" do
      get "/api/v1/organizations", headers: user.create_new_auth_token, as: :json
      expect(response).to have_http_status(:ok)
      json = response.parsed_body
      expect(json).to be_an(Array)
      expect(json.map { |o| o["id"] }).to include(organization.id)
    end
  end

  describe "POST /api/v1/organizations (作成)" do
    let(:user) { create(:user) }

    it "組織とメンバーシップを作成する" do
      post "/api/v1/organizations",
                    params: { organization: { name: "New Org" } },
                    headers: user.create_new_auth_token,
                    as: :json

      expect(response).to have_http_status(:created)
      json = response.parsed_body
      expect(json["id"]).to be_present
      expect(Membership.exists?(organization_id: json["id"], user: user)).to be true
    end
  end
end
