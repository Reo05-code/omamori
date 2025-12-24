require "rails_helper"

RSpec.describe User do
  describe "home location and radius" do
    it "home_radius が存在する場合は正の整数であること" do
      user = build(:user, home_radius: -5)
      expect(user).not_to be_valid
      expect(user.errors[:home_radius]).to be_present
    end

    it "緯度と経度が設定されると home_location を生成する" do
      user = build(:user)

      user.home_latitude = "35.0"
      user.home_longitude = "139.0"

      expect(user).to be_valid
      expect(user.home_location).to be_present
      expect(user.home_latitude).to be_within(0.0001).of(35.0)
      expect(user.home_longitude).to be_within(0.0001).of(139.0)
    end

    it "無効な文字列を渡すとエラーになる" do
      user = build(:user)
      user.home_latitude = "abc"
      user.home_longitude = "139.0"

      expect(user).not_to be_valid
      expect(user.errors[:home_latitude]).to be_present
    end

    it "片方のみ送るとエラーになる" do
      user = build(:user)
      user.home_latitude = "35.0"

      expect(user).not_to be_valid
      expect(user.errors[:home_latitude]).to be_present
      expect(user.errors[:home_longitude]).to be_present
    end

    it "home_radius のみ設定できる（位置情報なしでも有効）" do
      user = build(:user, home_radius: 50)

      expect(user).to be_valid
      expect(user.home_radius).to eq 50
      expect(user.home_location).to be_nil
    end

    it "明示的に両方を null にすると home_location が削除される" do
      user = build(:user)
      user.home_latitude = 10.0
      user.home_longitude = 20.0
      expect(user).to be_valid

      # 明示削除（setter に nil を渡す）
      user.home_latitude = nil
      user.home_longitude = nil
      user.valid?
      expect(user.home_location).to be_nil
    end
  end
end
