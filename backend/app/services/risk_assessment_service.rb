# frozen_string_literal: true

# SafetyLog のリスク判定を行い、RiskAssessmentレコードとして永続化するサービス
# 将来的にバッテリー残量、気温、GPS精度、移動距離などを総合的に評価してリスクレベルを判定する
class RiskAssessmentService
  # リスクレベルの定数（信号機に合わせた3段階）
  RISK_LEVEL_SAFE = "safe"       # 緑: 安全
  RISK_LEVEL_CAUTION = "caution" # 黄: 注意
  RISK_LEVEL_DANGER = "danger"   # 赤: 危険

  # デフォルトのポーリング間隔（秒）
  DEFAULT_POLL_INTERVAL = 60
  CAUTION_POLL_INTERVAL = 45
  DANGER_POLL_INTERVAL = 15

  attr_reader :safety_log

  def initialize(safety_log)
    @safety_log = safety_log
  end

  # リスク判定を実行して結果を返し、RiskAssessmentレコードとして永続化する
  # @return [Hash] { risk_level: String, risk_reasons: Array<String>, next_poll_interval: Integer }
  def call
    risk_level = calculate_risk_level
    risk_reasons = calculate_risk_reasons
    total_score = calculate_total_score

    save_risk_assessment(risk_level, risk_reasons, total_score)

    {
      risk_level: risk_level,
      risk_reasons: risk_reasons,
      next_poll_interval: poll_interval_for(risk_level)
    }
  end

  private

  # 現在はプレースホルダ実装（常にsafeを返す）
  def calculate_risk_level
    # 将来の実装例：
    # - SOSトリガー → danger
    # - バッテリー残量が10%以下 → caution
    # - 気温が35度以上または5度以下 → caution
    # - GPS精度が50m以上 → 位置情報信頼度低下の警告
    # - 一定時間移動なし → 状況確認必要
    RISK_LEVEL_SAFE
  end

  # 判定理由コード配列を生成（国際化対応のため英語コードを使用）
  def calculate_risk_reasons
    # 将来の実装例：
    # reasons = []
    # reasons << "sos_trigger" if safety_log.trigger_type_sos?
    # reasons << "low_battery" if safety_log.battery_level <= 10
    # reasons << "high_temperature" if safety_log.temperature && safety_log.temperature >= 35
    # reasons << "low_temperature" if safety_log.temperature && safety_log.temperature <= 5
    # reasons << "poor_gps_accuracy" if safety_log.gps_accuracy && safety_log.gps_accuracy >= 50
    # reasons
    []
  end

  # スコア合計を計算
  def calculate_total_score
    # 将来の実装例：各要因のスコアを合算
    # battery_score + temperature_score + movement_score + ...
    0
  end

  # リスクレベルに応じたポーリング間隔を返す
  def poll_interval_for(risk_level)
    case risk_level
    when RISK_LEVEL_DANGER
      DANGER_POLL_INTERVAL
    when RISK_LEVEL_CAUTION
      CAUTION_POLL_INTERVAL
    else
      DEFAULT_POLL_INTERVAL
    end
  end

  # RiskAssessment を見つけて更新、なければ初期化して保存する
  def save_risk_assessment(risk_level, risk_reasons, total_score)
    ra = RiskAssessment.find_or_initialize_by(safety_log_id: safety_log.id)
    ra.assign_attributes(
      score: total_score,
      level: RiskAssessment.levels[risk_level],
      details: {
        reasons: risk_reasons,
        factors: {}
      }
    )
    ra.save!
  end
end
