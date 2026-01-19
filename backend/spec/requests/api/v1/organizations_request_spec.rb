# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Organizations" do
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
      expect(json.pluck("id")).to include(organization.id)
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

  describe "PATCH /api/v1/organizations/:id (更新)" do
    let(:admin) { create(:user) }
    let(:worker) { create(:user) }
    let(:organization) { create(:organization, name: "Old Name") }

    before do
      create(:membership, organization: organization, user: admin, role: :admin)
      create(:membership, organization: organization, user: worker, role: :worker)
    end

    context "管理者の場合" do
      it "組織名を更新できる" do
        patch "/api/v1/organizations/#{organization.id}",
              params: { organization: { name: "New Name" } },
              headers: admin.create_new_auth_token,
              as: :json

        expect(response).to have_http_status(:ok)
        json = response.parsed_body
        expect(json["name"]).to eq("New Name")
        expect(organization.reload.name).to eq("New Name")
      end

      it "バリデーションエラーの場合は422を返す" do
        patch "/api/v1/organizations/#{organization.id}",
              params: { organization: { name: "" } },
              headers: admin.create_new_auth_token,
              as: :json

        expect(response).to have_http_status(:unprocessable_content)
        json = response.parsed_body
        expect(json["errors"]).to be_present
      end
    end

    context "worker（作業者）の場合" do
      it "403 forbidden を返す" do
        patch "/api/v1/organizations/#{organization.id}",
              params: { organization: { name: "New Name" } },
              headers: worker.create_new_auth_token,
              as: :json

        expect(response).to have_http_status(:forbidden)
        json = response.parsed_body
        expect(json["error"]).to be_present
      end
    end

    context "組織に所属していない場合" do
      it "404 not found を返す" do
        outsider = create(:user)

        patch "/api/v1/organizations/#{organization.id}",
              params: { organization: { name: "New Name" } },
              headers: outsider.create_new_auth_token,
              as: :json

        expect(response).to have_http_status(:not_found)
      end
    end
  end
end
