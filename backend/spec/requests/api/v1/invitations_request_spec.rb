# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Invitations" do
  describe "POST /api/v1/organizations/:organization_id/invitations (招待作成)" do
    let(:admin) { create(:user) }
    let(:organization) { create(:organization) }

    before do
      create(:membership, organization: organization, user: admin, role: :admin)
    end

    it "管理者による招待作成に成功する" do
      post "/api/v1/organizations/#{organization.id}/invitations",
           params: { invitation: { invited_email: "invitee@example.com", role: "worker" } },
           headers: admin.create_new_auth_token,
           as: :json

      expect(response).to have_http_status(:created)
      json = response.parsed_body
      expect(json["invited_email"]).to eq("invitee@example.com")
    end
  end

  describe "POST /api/v1/invitations/accept (招待受諾)" do
    let(:inviter) { create(:user) }
    let(:invitee) { create(:user, email: "acceptor@example.com") }
    let(:invitation) { create(:invitation, inviter: inviter, organization: org, invited_email: invitee.email) }
    let(:org) { create(:organization) }

    before { create(:membership, organization: org, user: inviter, role: :admin) }

    it "保留中の招待を受諾しメンバーシップを作成する" do
      post "/api/v1/invitations/accept",
           params: { token: invitation.token },
           headers: invitee.create_new_auth_token,
           as: :json

      expect(response).to have_http_status(:ok)
      json = response.parsed_body
      expect(json["message"]).to be_present
      expect(org.memberships.exists?(user: invitee)).to be true
    end
  end

  describe "DELETE /api/v1/organizations/:organization_id/invitations/:id (招待削除)" do
    let(:admin) { create(:user) }
    let(:worker) { create(:user) }
    let(:organization) { create(:organization) }
    let!(:pending_invitation) { create(:invitation, organization: organization, inviter: admin, invited_email: "pending@example.com") }

    before do
      create(:membership, organization: organization, user: worker, role: :worker)
    end

    context "管理者の場合" do
      it "pending な招待を削除できる" do
        delete "/api/v1/organizations/#{organization.id}/invitations/#{pending_invitation.id}",
               headers: admin.create_new_auth_token,
               as: :json

        expect(response).to have_http_status(:ok)
        json = response.parsed_body
        expect(json["message"]).to be_present
        expect(Invitation.exists?(pending_invitation.id)).to be false
      end

      it "承諾済みの招待は存在しないものとして扱われ404を返す" do
        accepted_invitation = create(:invitation, organization: organization, inviter: admin, accepted_at: Time.current)

        delete "/api/v1/organizations/#{organization.id}/invitations/#{accepted_invitation.id}",
               headers: admin.create_new_auth_token,
               as: :json

        expect(response).to have_http_status(:not_found)
        json = response.parsed_body
        expect(json["error"]).to be_present
        expect(Invitation.exists?(accepted_invitation.id)).to be true
      end

      it "期限切れの招待は存在しないものとして扱われ404を返す" do
        expired_invitation = create(:invitation, organization: organization, inviter: admin, expires_at: 1.day.ago)

        delete "/api/v1/organizations/#{organization.id}/invitations/#{expired_invitation.id}",
               headers: admin.create_new_auth_token,
               as: :json

        expect(response).to have_http_status(:not_found)
        json = response.parsed_body
        expect(json["error"]).to be_present
      end
    end

    context "worker（作業者）の場合" do
      it "403 forbidden を返す" do
        delete "/api/v1/organizations/#{organization.id}/invitations/#{pending_invitation.id}",
               headers: worker.create_new_auth_token,
               as: :json

        expect(response).to have_http_status(:forbidden)
      end
    end

    context "組織に所属していない場合" do
      it "404 not found を返す" do
        outsider = create(:user)

        delete "/api/v1/organizations/#{organization.id}/invitations/#{pending_invitation.id}",
               headers: outsider.create_new_auth_token,
               as: :json

        expect(response).to have_http_status(:not_found)
      end
    end
  end
end
