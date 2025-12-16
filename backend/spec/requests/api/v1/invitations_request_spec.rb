# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Invitations", type: :request do
  describe "POST /api/v1/organizations/:organization_id/invitations (招待作成)" do
    let(:admin) { create(:user) }
    let(:organization) { create(:organization) }

    before do
      create(:membership, organization: organization, user: admin, role: :admin)
    end

    it "管理者による招待作成に成功する" do
      post_with_csrf "/api/v1/organizations/#{organization.id}/invitations",
                    params: { invitation: { invited_email: "invitee@example.com", role: "worker" } },
                    headers: admin.create_new_auth_token,
                    as: :json

      expect(response).to have_http_status(:created)
      json = response.parsed_body
      expect(json["invited_email"]).to eq("invitee@example.com")
    end
  end

  describe "POST /api/v1/invitations/accept (招待受諾)" do
    it "保留中の招待を受諾しメンバーシップを作成する" do
      inviter = create(:user)
      org = create(:organization)
      create(:membership, organization: org, user: inviter, role: :admin)

      invitee = create(:user, email: "acceptor@example.com")
      invitation = create(:invitation, inviter: inviter, organization: org, invited_email: invitee.email)

      post_with_csrf "/api/v1/invitations/accept",
                    params: { token: invitation.token },
                    headers: invitee.create_new_auth_token,
                    as: :json

      expect(response).to have_http_status(:ok)
      json = response.parsed_body
      expect(json["message"]).to be_present
      expect(org.memberships.exists?(user: invitee)).to be true
    end
  end
end
