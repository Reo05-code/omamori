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
      expect(invitation.errors[:invited_email]).to include("can't be blank")
    end
  end
end
