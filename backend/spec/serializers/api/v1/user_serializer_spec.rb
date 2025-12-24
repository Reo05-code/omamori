require "rails_helper"

RSpec.describe Api::V1::UserSerializer do
  describe "シリアライズ" do
    let(:user) { create(:user) }

    it "home_latitude/home_longitude/home_radius/onboarded/organizations_count を返す" do
      org = create(:organization)
      create(:membership, organization: org, user: user, role: :worker)
      user.update!(onboarded: true, home_radius: 42)

      hash = described_class.new(user).as_json

      expect(hash[:home_latitude]).to be_nil
      expect(hash[:home_longitude]).to be_nil
      expect(hash[:home_radius]).to eq 42
      expect(hash[:onboarded]).to be true
      expect(hash[:organizations_count]).to eq 1
    end
  end
end
