# frozen_string_literal: true

require "rails_helper"

RSpec.describe RiskAssessment do
  describe "Associations" do
    it { is_expected.to belong_to(:safety_log) }
    it { is_expected.to have_one(:work_session).through(:safety_log) }
  end

  describe "Validations" do
    subject { build(:risk_assessment) }

    it { is_expected.to validate_presence_of(:score) }
    it { is_expected.to validate_presence_of(:level) }
    it { is_expected.to validate_presence_of(:details) }

    it { is_expected.to validate_numericality_of(:score).only_integer.is_greater_than_or_equal_to(0) }

    it "score が負数の場合は無効" do
      risk_assessment = build(:risk_assessment, score: -1)
      expect(risk_assessment).not_to be_valid
      expect(risk_assessment.errors[:score]).to be_present
    end

    it "details['reasons'] に不正なコードが含まれる場合は無効" do
      risk_assessment = build(:risk_assessment, details: {
                                reasons: ["unknown_reason"],
                                factors: {}
                              })

      expect(risk_assessment).not_to be_valid
      expect(risk_assessment.errors[:details].join).to include("invalid reasons")
    end
  end

  describe "Enum: level" do
    it "safe (0) を設定できる" do
      risk_assessment = build(:risk_assessment, level: :safe)
      expect(risk_assessment).to be_safe
      expect(risk_assessment.level).to eq("safe")
    end

    it "caution (1) を設定できる" do
      risk_assessment = build(:risk_assessment, level: :caution)
      expect(risk_assessment).to be_caution
      expect(risk_assessment.level).to eq("caution")
    end

    it "danger (2) を設定できる" do
      risk_assessment = build(:risk_assessment, level: :danger)
      expect(risk_assessment).to be_danger
      expect(risk_assessment.level).to eq("danger")
    end

    it "文字列でレベルを設定できる" do
      risk_assessment = create(:risk_assessment, level: "caution")
      expect(risk_assessment.level).to eq("caution")
      expect(risk_assessment.read_attribute_before_type_cast(:level)).to eq(1)
    end
  end

  describe "jsonb: details" do
    it "jsonb を保存できる (persisted)" do
      risk_assessment = create(:risk_assessment, details: {
                                 reasons: %w[high_temperature low_battery],
                                 factors: {
                                   "temp_score" => 40,
                                   "battery_score" => 10
                                 }
                               })

      expect(risk_assessment).to be_persisted
    end

    it "保存された jsonb の reasons が正しい" do
      risk_assessment = create(:risk_assessment, details: {
                                 reasons: %w[high_temperature low_battery],
                                 factors: {}
                               })

      expect(risk_assessment.details["reasons"]).to eq(%w[high_temperature low_battery])
    end

    it "保存された jsonb の factors が正しい" do
      risk_assessment = create(:risk_assessment, details: { reasons: [], factors: { "temp_score" => 40, "battery_score" => 10 } })
      expect(risk_assessment.details["factors"]).to eq("temp_score" => 40, "battery_score" => 10)
    end

    it "空の reasons と factors でも保存できる" do
      risk_assessment = create(:risk_assessment, details: {
                                 reasons: [],
                                 factors: {}
                               })

      expect(risk_assessment.details["reasons"]).to eq([])
      expect(risk_assessment.details["factors"]).to eq({})
    end

    it "details をクエリで検索できる" do
      create(:risk_assessment, details: { reasons: ["high_temperature"] })
      create(:risk_assessment, details: { reasons: ["low_battery"] })

      results = described_class.where("details -> 'reasons' @> ?", ["high_temperature"].to_json)
      expect(results.count).to eq(1)
      expect(results.first.details["reasons"]).to include("high_temperature")
    end
  end

  describe "Unique constraint: safety_log_id" do
    it "同じ safety_log_id に対して複数の RiskAssessment を作成できない" do
      safety_log = create(:safety_log)
      create(:risk_assessment, safety_log: safety_log)

      expect do
        create(:risk_assessment, safety_log: safety_log)
      end.to raise_error(ActiveRecord::RecordNotUnique)
    end

    it "find_or_initialize_by で既存レコードを取得できる" do
      safety_log = create(:safety_log)
      existing = create(:risk_assessment, safety_log: safety_log, score: 10)

      found = described_class.find_or_initialize_by(safety_log_id: safety_log.id)
      expect(found).to eq(existing)
      expect(found.score).to eq(10)
      expect(found).to be_persisted
    end

    it "find_or_initialize_by で新規レコードを初期化できる" do
      safety_log = create(:safety_log)

      found = described_class.find_or_initialize_by(safety_log_id: safety_log.id)
      expect(found).to be_new_record
      expect(found.safety_log_id).to eq(safety_log.id)
    end
  end

  describe "Factory traits" do
    it ":safe トレイトでレコードを作成できる" do
      risk_assessment = create(:risk_assessment, :safe)
      expect(risk_assessment).to be_safe
      expect(risk_assessment.score).to eq(0)
      expect(risk_assessment.details["reasons"]).to eq([])
    end

    it ":caution トレイトでレコードを作成できる" do
      risk_assessment = create(:risk_assessment, :caution)
      expect(risk_assessment).to be_caution
      expect(risk_assessment.score).to eq(50)
      expect(risk_assessment.details["reasons"]).to include("low_battery", "high_temperature")
    end

    it ":danger トレイトでレコードを作成できる" do
      risk_assessment = create(:risk_assessment, :danger)
      expect(risk_assessment).to be_danger
      expect(risk_assessment.score).to eq(100)
      expect(risk_assessment.details["reasons"]).to include("sos_trigger", "low_battery")
    end

    it ":high_temperature トレイトでレコードを作成できる" do
      risk_assessment = create(:risk_assessment, :high_temperature)
      expect(risk_assessment).to be_caution
      expect(risk_assessment.details["reasons"]).to eq(["high_temperature"])
      expect(risk_assessment.details["factors"]["temp_score"]).to eq(40)
    end

    it ":low_battery トレイトでレコードを作成できる" do
      risk_assessment = create(:risk_assessment, :low_battery)
      expect(risk_assessment).to be_caution
      expect(risk_assessment.details["reasons"]).to eq(["low_battery"])
      expect(risk_assessment.details["factors"]["battery_score"]).to eq(30)
    end

    it ":long_inactive トレイトでレコードを作成できる" do
      risk_assessment = create(:risk_assessment, :long_inactive)
      expect(risk_assessment).to be_caution
      expect(risk_assessment.details["reasons"]).to eq(["long_inactive"])
    end

    it ":poor_gps_accuracy トレイトでレコードを作成できる" do
      risk_assessment = create(:risk_assessment, :poor_gps_accuracy)
      expect(risk_assessment).to be_caution
      expect(risk_assessment.details["reasons"]).to eq(["poor_gps_accuracy"])
    end
  end

  describe "dependent: :destroy" do
    it "SafetyLog が削除されると RiskAssessment も削除される" do
      safety_log = create(:safety_log)
      risk_assessment = create(:risk_assessment, safety_log: safety_log)

      expect do
        safety_log.destroy
      end.to change(described_class, :count).by(-1)

      expect(described_class.find_by(id: risk_assessment.id)).to be_nil
    end
  end
end
