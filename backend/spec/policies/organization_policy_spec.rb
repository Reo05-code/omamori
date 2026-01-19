# frozen_string_literal: true

require "rails_helper"

RSpec.describe OrganizationPolicy do
  let(:organization) { create(:organization) }
  let(:admin_user) { create(:user) }
  let(:worker_user) { create(:user) }
  let(:outsider_user) { create(:user) }

  before do
    create(:membership, organization: organization, user: admin_user, role: :admin)
    create(:membership, organization: organization, user: worker_user, role: :worker)
  end

  describe "#update" do
    context "管理者の場合" do
      it "allowed が true を返す" do
        policy = described_class.new(admin_user, organization)
        result = policy.update

        expect(result.allowed?).to be true
        expect(result.error_key).to be_nil
      end
    end

    context "worker（作業者）の場合" do
      it "allowed が false で error_key が :forbidden を返す" do
        policy = described_class.new(worker_user, organization)
        result = policy.update

        expect(result.allowed?).to be false
        expect(result.error_key).to eq(:forbidden)
      end
    end

    context "組織に所属していない場合" do
      it "allowed が false で error_key が :forbidden を返す" do
        policy = described_class.new(outsider_user, organization)
        result = policy.update

        expect(result.allowed?).to be false
        expect(result.error_key).to eq(:forbidden)
      end
    end
  end
end
