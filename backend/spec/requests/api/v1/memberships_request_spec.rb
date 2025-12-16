# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Memberships", type: :request do
  describe "GET /api/v1/organizations/:organization_id/memberships (メンバー一覧)" do
    let(:admin) { create(:user) }
    let(:worker) { create(:user) }
    let(:organization) { create(:organization) }

    before do
      create(:membership, organization: organization, user: admin, role: :admin)
      create(:membership, organization: organization, user: worker, role: :worker)
    end

    it "組織のメンバー一覧を返す" do
      get "/api/v1/organizations/#{organization.id}/memberships", headers: admin.create_new_auth_token, as: :json

      expect(response).to have_http_status(:ok)
      json = response.parsed_body
      expect(json).to be_an(Array)
      expect(json.map { |m| m["user_id"] }).to include(worker.id)
    end
  end

  describe "PUT /api/v1/organizations/:organization_id/memberships/:id (更新)" do
    let(:admin) { create(:user) }
    let(:worker) { create(:user) }
    let(:organization) { create(:organization) }
    let!(:admin_membership) { create(:membership, organization: organization, user: admin, role: :admin) }
    let!(:worker_membership) { create(:membership, organization: organization, user: worker, role: :worker) }

    context "管理者の場合" do
      it "メンバーのロールを更新できる" do
        put "/api/v1/organizations/#{organization.id}/memberships/#{worker_membership.id}",
                     params: { membership: { role: "admin" } },
                     headers: admin.create_new_auth_token,
                     as: :json

        expect(response).to have_http_status(:ok)
        json = response.parsed_body
        expect(json["role"]).to eq("admin")
        expect(worker_membership.reload.role).to eq("admin")
      end
    end

    context "非管理者の場合" do
      it "403 forbidden を返す" do
        put "/api/v1/organizations/#{organization.id}/memberships/#{admin_membership.id}",
                     params: { membership: { role: "worker" } },
                     headers: worker.create_new_auth_token,
                     as: :json

        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe "DELETE /api/v1/organizations/:organization_id/memberships/:id (削除)" do
    let(:admin) { create(:user) }
    let(:member) { create(:user) }
    let(:organization) { create(:organization) }
    let!(:admin_membership) { create(:membership, organization: organization, user: admin, role: :admin) }
    let!(:member_membership) { create(:membership, organization: organization, user: member, role: :worker) }

    context "管理者の場合" do
      it "メンバーを削除できる" do
        expect do
          delete "/api/v1/organizations/#{organization.id}/memberships/#{member_membership.id}",
                          headers: admin.create_new_auth_token,
                          as: :json
        end.to change(organization.memberships, :count).by(-1)

        expect(response).to have_http_status(:ok)
      end
    end

    context "非管理者の場合" do
      it "403 forbidden を返す" do
        delete "/api/v1/organizations/#{organization.id}/memberships/#{admin_membership.id}",
                        headers: member.create_new_auth_token,
                        as: :json

        expect(response).to have_http_status(:forbidden)
      end
    end
  end
end
