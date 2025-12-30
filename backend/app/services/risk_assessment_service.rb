# frozen_string_literal: true

class RiskAssessmentService
  # リスクレベル定数
  RISK_LEVEL_SAFE = "safe"
  RISK_LEVEL_CAUTION = "caution"
  RISK_LEVEL_DANGER = "danger"

  # 閾値
  DANGER_THRESHOLD = 80
  CAUTION_THRESHOLD = 40

  # ポーリング間隔
  DEFAULT_POLL_INTERVAL = 60
  CAUTION_POLL_INTERVAL = 45
  DANGER_POLL_INTERVAL = 15

  attr_reader :safety_log

  def initialize(safety_log)
    @safety_log = safety_log
  end

  def call
    scorer = RiskAssessmentScorer.new(safety_log)
    factors = scorer.factors
    total_score = [factors.values.sum, 0].max

    risk_reasons = scorer.reasons
    risk_level = determine_level(total_score, risk_reasons)

    save_risk_assessment(risk_level, risk_reasons, total_score, factors)
    handle_alert_creation(risk_level)

    {
      risk_level: risk_level,
      risk_reasons: risk_reasons,
      next_poll_interval: poll_interval_for(risk_level)
    }
  end

  private

  # リスクレベルを点数で判定(SOSが来たら即DANGER)
  def determine_level(score, reasons)
    return RISK_LEVEL_DANGER if reasons.include?("sos_trigger")
    return RISK_LEVEL_DANGER if score >= DANGER_THRESHOLD
    return RISK_LEVEL_CAUTION if score >= CAUTION_THRESHOLD

    RISK_LEVEL_SAFE
  end

  def poll_interval_for(level)
    case level
    when RISK_LEVEL_DANGER  then DANGER_POLL_INTERVAL
    when RISK_LEVEL_CAUTION then CAUTION_POLL_INTERVAL
    else                         DEFAULT_POLL_INTERVAL
    end
  end

  def save_risk_assessment(level, reasons, score, factors)
    # details カラムには検索用の reasons と、分析用の factors を両方入れる
    details_payload = {
      reasons: reasons,
      factors: factors
    }

    # あれば更新、なければ新規作成(createだと重複エラーになる)
    RiskAssessment.find_or_initialize_by(safety_log_id: @safety_log.id).update!(
      score: score,
      level: level,
      details: details_payload
    )
  end

  def handle_alert_creation(risk_level)
    alert_config = case risk_level
                   when RISK_LEVEL_DANGER
                     { type: :risk_high, severity: :high }
                   when RISK_LEVEL_CAUTION
                     { type: :risk_medium, severity: :medium }
                   else
                     nil
                   end

    return unless alert_config

    # AlertCreationServiceを呼び出してアラート作成
    AlertCreationService.new(
      work_session: @safety_log.work_session,
      alert_type: alert_config[:type],
      severity: alert_config[:severity],
      safety_log_id: @safety_log.id
    ).call
  end
end
