# frozen_string_literal: true

# SafetyLog のリスク判定を行うサービス（プレースホルダ実装）
# 将来的にバッテリー残量、気温、GPS精度、移動距離などを総合的に評価してリスクレベルを判定する
class RiskAssessmentService
  # リスクレベルの定数
  RISK_LEVEL_SAFE = "safe"
  RISK_LEVEL_CAUTION = "caution"
  RISK_LEVEL_WARNING = "warning"
  RISK_LEVEL_DANGER = "danger"

  # デフォルトのポーリング間隔（秒）
  DEFAULT_POLL_INTERVAL = 60
  CAUTION_POLL_INTERVAL = 45
  WARNING_POLL_INTERVAL = 30
  DANGER_POLL_INTERVAL = 15

  attr_reader :safety_log

  def initialize(safety_log)
    @safety_log = safety_log
  end

  # リスク判定を実行して結果を返す
  # @return [Hash] { risk_level: String, risk_reasons: Array<String>, next_poll_interval: Integer }
  def call
    {
      risk_level: RISK_LEVEL_SAFE,
      risk_reasons: [],
      next_poll_interval: DEFAULT_POLL_INTERVAL
    }
  end

  # 将来の実装例：
  # - バッテリー残量が20%以下 → caution
  # - バッテリー残量が10%以下 → warning
  # - 気温が35度以上または5度以下 → caution
  # - GPS精度が50m以上 → 位置情報信頼度低下の警告
  # - SOSトリガー → danger
  # - 一定時間移動なし → 状況確認必要
end
