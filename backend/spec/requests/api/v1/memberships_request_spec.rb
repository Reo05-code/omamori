# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Memberships" do
  describe "GET /api/v1/organizations/:organization_id/memberships (メンバー一覧)" do
    let(:admin) { create(:user) }
    let(:worker) { create(:user) }
    let(:organization) { create(:organization) }

    let(:worker_active_session) { create(:work_session, organization: organization, user: worker, status: :in_progress, ended_at: nil) }

    before do
      create(:membership, organization: organization, user: admin, role: :admin)
      create(:membership, organization: organization, user: worker, role: :worker)
      # force creation of the lazy work session before the request
      worker_active_session
    end

    context "管理者の場合" do
      it "組織のメンバー一覧を返し、active_work_session を含む" do
        get "/api/v1/organizations/#{organization.id}/memberships", headers: admin.create_new_auth_token, as: :json

        expect(response).to have_http_status(:ok)
        json = response.parsed_body
        expect(json).to be_an(Array)
        expect(json.pluck("user_id")).to include(worker.id)

        worker_row = json.find { |row| row["user_id"] == worker.id }
        expect(worker_row).to be_present
        expect(worker_row["active_work_session"]).to eq({ "active" => true, "id" => worker_active_session.id })
      end
    end

    context "worker（作業者）の場合" do
      it "403 forbidden を返す" do
        get "/api/v1/organizations/#{organization.id}/memberships", headers: worker.create_new_auth_token, as: :json

        expect(response).to have_http_status(:forbidden)
      end
    end

    context "組織に所属していない場合" do
      it "404 not found を返す" do
        outsider = create(:user)

        get "/api/v1/organizations/#{organization.id}/memberships", headers: outsider.create_new_auth_token, as: :json

        expect(response).to have_http_status(:not_found)
      end
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
