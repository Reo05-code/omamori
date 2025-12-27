# frozen_string_literal: true

require "rails_helper"

RSpec.describe RiskAssessmentService do
  let(:user) { create(:user) }
  let(:organization) { create(:organization) }
  let(:work_session) { create(:work_session, user: user, organization: organization) }

  describe "#call" do
    subject(:result) { described_class.new(safety_log).call }

    context "通常のログを評価するとき" do
      let(:safety_log) { create(:safety_log, work_session: work_session, trigger_type: :heartbeat, battery_level: 80) }

      it "期待する構造を返す" do
        expect(result).to include(:risk_level, :risk_reasons, :next_poll_interval)
      end

      it "RiskAssessment レコードを作成する" do
        result

        ra = RiskAssessment.find_by(safety_log_id: safety_log.id)
        aggregate_failures do
          expect(ra).not_to be_nil
          expect(ra.score).to be_a(Integer)
          expect(ra.level).to be_present
          expect(ra.details).to be_a(Hash)
          expect(ra.details["reasons"]).to be_an(Array)
          expect(ra.details["factors"]).to be_a(Hash)
        end
      end
    end

    context "SOSトリガーの場合" do
      let(:safety_log) { create(:safety_log, work_session: work_session, trigger_type: :sos) }

      it "危険レベルを返す" do
        expect(result[:risk_level]).to eq("danger")

        ra = RiskAssessment.find_by(safety_log_id: safety_log.id)
        expect(ra.level.to_s).to eq("danger")
      end
    end

    context "既存の RiskAssessment が存在する場合" do
      let(:safety_log) { create(:safety_log, work_session: work_session, trigger_type: :heartbeat) }

      it "重複せず更新される" do
        result
        expect(RiskAssessment.where(safety_log_id: safety_log.id).count).to eq(1)

        safety_log.update!(weather_temp: 40)

        described_class.new(safety_log).call
        expect(RiskAssessment.where(safety_log_id: safety_log.id).count).to eq(1)

        ra = RiskAssessment.find_by(safety_log_id: safety_log.id)
        expect(ra.score).to be >= 0
        expect(ra.details["factors"]).to be_a(Hash)
      end
    end
  end

  describe "リスクレベル判定" do
    subject(:result) { described_class.new(safety_log).call }

    let(:safety_log) { create(:safety_log, work_session: work_session, trigger_type: :heartbeat) }

    context "スコアが0-39の場合" do
      before do
        factors = { sos_score: 0, location_score: 0, movement_score: 0,
                    temp_score: 0, battery_score: 0, gps_score: 0 }
        scorer = instance_double(RiskAssessmentScorer)
        allow(RiskAssessmentScorer).to receive(:new).with(safety_log).and_return(scorer)
        allow(scorer).to receive_messages(factors: factors, reasons: [])
      end

      it "safe レベルを返す" do
        expect(result[:risk_level]).to eq("safe")
      end
    end

    context "スコアが40-79の場合" do
      before do
        factors = { sos_score: 0, location_score: 0, movement_score: 0,
                    temp_score: 30, battery_score: 10, gps_score: 0 }
        scorer = instance_double(RiskAssessmentScorer)
        allow(RiskAssessmentScorer).to receive(:new).with(safety_log).and_return(scorer)
        allow(scorer).to receive_messages(factors: factors, reasons: %w[moderate_heat battery_caution])
      end

      it "caution レベルを返す" do
        expect(result[:risk_level]).to eq("caution")
      end
    end

    context "スコアが80以上の場合" do
      before do
        factors = { sos_score: 0, location_score: 0, movement_score: 40,
                    temp_score: 50, battery_score: 0, gps_score: 0 }
        scorer = instance_double(RiskAssessmentScorer)
        allow(RiskAssessmentScorer).to receive(:new).with(safety_log).and_return(scorer)
        allow(scorer).to receive_messages(factors: factors, reasons: %w[long_inactive high_temperature])
      end

      it "danger レベルを返す" do
        expect(result[:risk_level]).to eq("danger")
      end
    end

    context "SOS トリガーが含まれる場合" do
      before do
        factors = { sos_score: 999, location_score: 0, movement_score: 0,
                    temp_score: 0, battery_score: 0, gps_score: 0 }
        scorer = instance_double(RiskAssessmentScorer)
        allow(RiskAssessmentScorer).to receive(:new).with(safety_log).and_return(scorer)
        allow(scorer).to receive_messages(factors: factors, reasons: ["sos_trigger"])
      end

      it "スコアに関わらず danger を返す" do
        expect(result[:risk_level]).to eq("danger")
      end
    end
  end

  describe "ポーリング間隔" do
    subject(:result) { described_class.new(safety_log).call }

    let(:safety_log) { create(:safety_log, work_session: work_session, trigger_type: :heartbeat) }

    context "safe レベルの場合" do
      before do
        factors = { sos_score: 0, location_score: 0, movement_score: 0,
                    temp_score: 0, battery_score: 0, gps_score: 0 }
        scorer = instance_double(RiskAssessmentScorer)
        allow(RiskAssessmentScorer).to receive(:new).with(safety_log).and_return(scorer)
        allow(scorer).to receive_messages(factors: factors, reasons: [])
      end

      it "60秒を返す" do
        expect(result[:next_poll_interval]).to eq(60)
      end
    end

    context "caution レベルの場合" do
      before do
        factors = { sos_score: 0, location_score: 0, movement_score: 0,
                    temp_score: 30, battery_score: 10, gps_score: 0 }
        scorer = instance_double(RiskAssessmentScorer)
        allow(RiskAssessmentScorer).to receive(:new).with(safety_log).and_return(scorer)
        allow(scorer).to receive_messages(factors: factors, reasons: ["moderate_heat"])
      end

      it "45秒を返す" do
        expect(result[:next_poll_interval]).to eq(45)
      end
    end

    context "danger レベルの場合" do
      before do
        factors = { sos_score: 0, location_score: 0, movement_score: 40,
                    temp_score: 50, battery_score: 0, gps_score: 0 }
        scorer = instance_double(RiskAssessmentScorer)
        allow(RiskAssessmentScorer).to receive(:new).with(safety_log).and_return(scorer)
        allow(scorer).to receive_messages(factors: factors, reasons: %w[long_inactive high_temperature])
      end

      it "15秒を返す" do
        expect(result[:next_poll_interval]).to eq(15)
      end
    end
  end

  describe "バッテリーレベルによる影響" do
    subject(:result) { described_class.new(safety_log).call }

    let(:safety_log) { create(:safety_log, work_session: work_session, trigger_type: :heartbeat) }

    context "バッテリー残量が10%以下の場合" do
      before { safety_log.update!(battery_level: 8) }

      it "low_battery の理由が含まれる" do
        expect(result[:risk_reasons]).to include("low_battery")
      end
    end

    context "バッテリー残量が11-20%の場合" do
      before { safety_log.update!(battery_level: 15) }

      it "battery_caution の理由が含まれる" do
        expect(result[:risk_reasons]).to include("battery_caution")
      end
    end

    context "バッテリー残量が51%以上の場合" do
      before { safety_log.update!(battery_level: 80) }

      it "バッテリー関連の理由が含まれない" do
        battery_reasons = result[:risk_reasons] & %w[low_battery battery_caution]
        expect(battery_reasons).to be_empty
      end
    end
  end

  describe "気温による影響" do
    subject(:result) { described_class.new(safety_log).call }

    let(:safety_log) { create(:safety_log, work_session: work_session, trigger_type: :heartbeat) }

    context "気温が35度以上の場合" do
      before { safety_log.update!(weather_temp: 37.5) }

      it "high_temperature の理由が含まれる" do
        expect(result[:risk_reasons]).to include("high_temperature")
      end
    end

    context "気温が30-34度の場合" do
      before { safety_log.update!(weather_temp: 32.0) }

      it "moderate_heat の理由が含まれる" do
        expect(result[:risk_reasons]).to include("moderate_heat")
      end
    end

    context "気温が5度以下の場合" do
      before { safety_log.update!(weather_temp: 3.0) }

      it "low_temperature の理由が含まれる" do
        expect(result[:risk_reasons]).to include("low_temperature")
      end
    end

    context "気温が適温の場合" do
      before { safety_log.update!(weather_temp: 20.0) }

      it "気温関連の理由が含まれない" do
        temp_reasons = result[:risk_reasons] & %w[high_temperature moderate_heat low_temperature]
        expect(temp_reasons).to be_empty
      end
    end
  end

  describe "GPS精度による影響" do
    subject(:result) { described_class.new(safety_log).call }

    let(:safety_log) { create(:safety_log, work_session: work_session, trigger_type: :heartbeat) }

    context "GPS精度が100mより悪い場合" do
      before { safety_log.update!(gps_accuracy: 150.0) }

      it "poor_gps_accuracy の理由が含まれる" do
        expect(result[:risk_reasons]).to include("poor_gps_accuracy")
      end
    end

    context "GPS精度が100m以下の場合" do
      before { safety_log.update!(gps_accuracy: 50.0) }

      it "GPS関連の理由が含まれない" do
        expect(result[:risk_reasons]).not_to include("poor_gps_accuracy")
      end
    end
  end

  describe "details の保存" do
    subject(:result) { described_class.new(safety_log).call }

    let(:safety_log) do
      create(:safety_log, work_session: work_session, trigger_type: :heartbeat, battery_level: 15, weather_temp: 32.0)
    end

    it "reasons と factors が正しく保存される" do
      result

      ra = RiskAssessment.find_by(safety_log_id: safety_log.id)
      aggregate_failures do
        expect(ra.details["reasons"]).to be_an(Array)
        expect(ra.details["factors"]).to be_a(Hash)
        expect(ra.details["factors"].keys).to include("battery_score", "temp_score")
      end
    end

    it "スコアの合計値が score に保存される" do
      result

      ra = RiskAssessment.find_by(safety_log_id: safety_log.id)
      factors_sum = ra.details["factors"].values.sum
      expect(ra.score).to eq([factors_sum, 0].max)
    end
  end
end
