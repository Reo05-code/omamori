require "rails_helper"

RSpec.describe User do
  describe "onboarding flag" do
    let(:user) { create(:user) }

    it "デフォルトは false である" do
      expect(user.onboarded).to be_falsey
    end
  end
end
