# frozen_string_literal: true

require "rails_helper"

RSpec.describe Membership, type: :model do
  subject(:membership) { build(:membership) }

  describe "Factory" do
    it "有効なファクトリを持つこと" do
      expect(membership).to be_valid
    end
  end

  describe "Validations" do
    it "role が必須であること" do
      membership.role = nil
      expect(membership).not_to be_valid
      expect(membership.errors[:role]).to include("can't be blank")
    end

    it "同一 organization に対して user は一意であること" do
      existing = create(:membership)
      duplicate = build(:membership, organization: existing.organization, user: existing.user)
      expect(duplicate).not_to be_valid
      expect(duplicate.errors[:user_id]).to include("has already been taken")
    end
  end
end
