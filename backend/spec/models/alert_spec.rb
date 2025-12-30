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

  describe "Enums and scopes" do
    it "`alert_type` と `severity` の enum マッピングが期待どおりであること" do
      expect(described_class.alert_types).to include("sos" => 0, "risk_high" => 1, "risk_medium" => 2, "battery_low" => 3, "timeout" => 4)
      expect(described_class.severities).to include("low" => 0, "medium" => 1, "high" => 2, "critical" => 3)
      expect(Alert::ALERT_TYPES).to eq(described_class.alert_types.keys)
    end

    it "scope `unresolved` が `open` と `in_progress` を返すこと" do
      ws = create(:work_session)
      create(:alert, work_session: ws, status: :open)
      create(:alert, work_session: ws, status: :in_progress)
      create(:alert, work_session: ws, status: :resolved)

      expect(described_class.unresolved.pluck(:status)).to all(satisfy { |s| %w[open in_progress].include?(s) })
    end

    it "scope `notifiable` が high|critical かつ未解決を返すこと" do
      ws = create(:work_session)
      a1 = create(:alert, work_session: ws, severity: :high, status: :open)
      a2 = create(:alert, work_session: ws, severity: :critical, status: :in_progress)
      _ = create(:alert, work_session: ws, severity: :low, status: :open)
      _ = create(:alert, work_session: ws, severity: :high, status: :resolved)

      ids = described_class.notifiable.pluck(:id)
      expect(ids).to include(a1.id, a2.id)
    end

    it "order_by_priority が status 昇順、その中で created_at 降順に並ぶこと" do
      ws = create(:work_session)
      a_open_old = create(:alert, work_session: ws, status: :open, created_at: 2.days.ago)
      a_open_new = create(:alert, work_session: ws, status: :open, created_at: 1.day.ago)
      a_inprog = create(:alert, work_session: ws, status: :in_progress, created_at: Time.current)

      ordered = described_class.order_by_priority.to_a
      expect(ordered.index(a_open_new)).to be < ordered.index(a_open_old)
      expect(ordered.index(a_open_old)).to be < ordered.index(a_inprog)
    end
  end
end
