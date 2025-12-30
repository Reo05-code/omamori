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

  describe "Risk level and alert integration" do
    let(:safety_log) { create(:safety_log, work_session: work_session) }

    it "danger の場合 risk_high/high を渡して AlertCreationService を呼ぶこと" do
      scorer = instance_double(RiskAssessmentScorer, factors: { a: 100 }, reasons: [])
      allow(RiskAssessmentScorer).to receive(:new).with(safety_log).and_return(scorer)

      spy_service = instance_spy(AlertCreationService)
      allow(AlertCreationService).to receive(:new).and_return(spy_service)

      described_class.new(safety_log).call

      expect(AlertCreationService).to have_received(:new).with(hash_including(alert_type: :risk_high, severity: :high))
      expect(spy_service).to have_received(:call)
    end

    it "caution の場合 risk_medium/medium を渡して AlertCreationService を呼ぶこと" do
      scorer = instance_double(RiskAssessmentScorer, factors: { a: 50 }, reasons: [])
      allow(RiskAssessmentScorer).to receive(:new).with(safety_log).and_return(scorer)

      spy_service = instance_spy(AlertCreationService)
      allow(AlertCreationService).to receive(:new).and_return(spy_service)

      described_class.new(safety_log).call

      expect(AlertCreationService).to have_received(:new).with(hash_including(alert_type: :risk_medium, severity: :medium))
      expect(spy_service).to have_received(:call)
    end

    it "safe の場合 AlertCreationService を呼ばないこと" do
      scorer = instance_double(RiskAssessmentScorer, factors: { a: 0 }, reasons: [])
      allow(RiskAssessmentScorer).to receive(:new).with(safety_log).and_return(scorer)

      allow(AlertCreationService).to receive(:new)

      described_class.new(safety_log).call

      expect(AlertCreationService).not_to have_received(:new)
    end
  end

  describe "Details persistence" do
    let(:safety_log) { create(:safety_log, work_session: work_session) }

    it "details を含めて RiskAssessment を作成/更新すること" do
      scorer = instance_double(RiskAssessmentScorer, factors: { a: 10 }, reasons: ["sos_trigger"])
      allow(RiskAssessmentScorer).to receive(:new).with(safety_log).and_return(scorer)

      described_class.new(safety_log).call

      ra = RiskAssessment.find_by(safety_log_id: safety_log.id)
      expect(ra).not_to be_nil
      expect(ra.details["reasons"]).to include("sos_trigger")
      expect(ra.details["factors"].keys.map(&:to_s)).to include("a")
    end
  end
end
