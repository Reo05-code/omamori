require "rails_helper"

RSpec.describe Alert do
  describe "Factory" do
    it "有効なファクトリを持つこと" do
      expect(build(:alert)).to be_valid
    end
  end

  describe "Associations" do
    it { is_expected.to belong_to(:work_session) }
    it { is_expected.to belong_to(:safety_log).optional }
    it { is_expected.to belong_to(:handled_by_user).class_name("User").optional }
  end

  describe "Validations" do
    it { is_expected.to validate_presence_of(:alert_type) }

    it "定義外の alert types はエラーになること" do
      expect { build(:alert, alert_type: "invalid_type") }.to raise_error(ArgumentError)
    end
  end

  describe "Enum status" do
    # enumの定義チェック
    it { is_expected.to define_enum_for(:status).with_values(open: 0, in_progress: 1, resolved: 2).with_prefix }

    it "ステータスを解決済みに更新し、対応者と解決日時を記録できること" do
      work_session = create(:work_session)
      user = create(:user)

      alert = described_class.create!(work_session: work_session, alert_type: "sos")

      expect(alert.alert_type).to eq("sos")
      expect(alert.status_open?).to be true

      alert.update!(status: :resolved, handled_by_user: user, resolved_at: Time.current)

      expect(alert.status_resolved?).to be true
      expect(alert.handled_by_user).to eq(user)
      expect(alert.resolved_at).not_to be_nil
    end
  end
end
