# frozen_string_literal: true

require "rails_helper"

RSpec.describe Invitation do
  subject(:invitation) { build(:invitation) }

  describe "Factory" do
    it "有効なファクトリを持つこと" do
      expect(invitation).to be_valid
    end
  end

  describe "Validations" do
    it "invited_email が必須であること" do
      invitation.invited_email = nil
      expect(invitation).not_to be_valid
      expect(invitation.errors[:invited_email]).to include(I18n.t("errors.messages.blank"))
    end
  end

  describe "#accept_by" do
    let(:organization) { create(:organization) }
    let(:inviter) { create(:user) }
    let(:invited_user) { create(:user, email: invited_email) }
    let(:invited_email) { "invitee@example.com" }
    let(:invitation) do
      create(
        :invitation,
        organization: organization,
        inviter: inviter,
        invited_email: invited_email,
        role: :worker
      )
    end

    before do
      create(:membership, organization: organization, user: inviter, role: :admin)
    end

    context "既に受諾済みで同じユーザーが再試行する場合" do
      it "既存のメンバーシップを返して成功する" do
        membership = create(:membership, organization: organization, user: invited_user, role: :worker)
        invitation.update!(accepted_at: Time.current)

        result = invitation.accept_by(invited_user)

        expect(result.success).to be(true)
        expect(result.membership).to eq(membership)
        expect(result.error_key).to be_nil
      end
    end

    context "既に受諾済みで別ユーザーが試行する場合" do
      it "invalid_token を返す" do
        other_user = create(:user, email: "other@example.com")
        invitation.update!(accepted_at: Time.current)

        result = invitation.accept_by(other_user)

        expect(result.success).to be(false)
        expect(result.error_key).to eq(:invalid_token)
      end
    end
  end
end
