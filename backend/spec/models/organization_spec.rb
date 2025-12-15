# frozen_string_literal: true

require "rails_helper"

RSpec.describe Organization, type: :model do
  subject(:organization) { build(:organization) }

  describe "Factory" do
    it "有効なファクトリを持つこと" do
      expect(organization).to be_valid
    end
  end

  describe "Validations" do
    it "name が必須であること" do
      organization.name = nil
      expect(organization).not_to be_valid
      expect(organization.errors[:name]).to include("can't be blank")
    end
  end
end
