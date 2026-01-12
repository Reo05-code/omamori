require "rails_helper"

RSpec.describe Alert do
  def create_alert_for_ordering(work_session:, status:, severity:, created_at:)
    create(:alert, work_session: work_session, status: status, severity: severity, created_at: created_at)
  end

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

    it "scope `urgent` が open かつ sos or critical を返すこと" do
      ws = create(:work_session)
      urgent_sos = create(:alert, work_session: ws, status: :open, alert_type: :sos, severity: :low)
      urgent_critical = create(:alert, work_session: ws, status: :open, alert_type: :battery_low, severity: :critical)
      _non_urgent_open = create(:alert, work_session: ws, status: :open, alert_type: :battery_low, severity: :high)
      _non_urgent_inprog = create(:alert, work_session: ws, status: :in_progress, alert_type: :sos, severity: :critical)

      ids = described_class.urgent.pluck(:id)
      expect(ids).to contain_exactly(urgent_sos.id, urgent_critical.id)
    end

    it "scope `not_urgent` が urgent を除外すること" do
      ws = create(:work_session)
      urgent_sos = create(:alert, work_session: ws, status: :open, alert_type: :sos, severity: :low)
      normal = create(:alert, work_session: ws, status: :open, alert_type: :battery_low, severity: :low)

      ids = described_class.not_urgent.pluck(:id)
      expect(ids).to include(normal.id)
      expect(ids).not_to include(urgent_sos.id)
    end

    it "order_by_priority が 未解決優先 → 重要度順 → created_at 降順に並ぶこと" do
      ws = create(:work_session)

      expected_ids = [
        create_alert_for_ordering(work_session: ws, status: :open, severity: :critical, created_at: 3.days.ago).id,
        create_alert_for_ordering(work_session: ws, status: :in_progress, severity: :high, created_at: 2.days.ago).id,
        create_alert_for_ordering(work_session: ws, status: :open, severity: :medium, created_at: 1.hour.ago).id,
        create_alert_for_ordering(work_session: ws, status: :open, severity: :medium, created_at: 2.hours.ago).id,
        create_alert_for_ordering(work_session: ws, status: :open, severity: :low, created_at: Time.current).id,
        create_alert_for_ordering(work_session: ws, status: :resolved, severity: :critical, created_at: 1.minute.ago).id
      ]

      expect(described_class.order_by_priority.pluck(:id).first(expected_ids.length)).to eq(expected_ids)
    end
  end
end
