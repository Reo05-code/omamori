class RiskAssessmentScorer
  def initialize(safety_log)
    @safety_log = safety_log
  end
  include RiskAssessmentHelpers

  def factors
    # factorsが未定義なら計算して保存
    @factors ||= {
      sos_score: sos_score,
      location_score: location_score,
      movement_score: movement_score,
      temp_score: temperature_score,
      battery_score: battery_score,
      gps_score: gps_accuracy_score
    }
  end

  def reasons
    return ["sos_trigger"] if sos_score.positive?

    [].tap do |r|
      r.concat location_reasons
      r.concat movement_reasons
      r.concat temperature_reasons
      r.concat battery_reasons
      r.concat gps_reasons
    end.uniq
  end

  private

  def sos_score
    @safety_log.trigger_type_sos? ? 999 : 0
  end

  def location_score
    return 0 unless home_location_present?

    in_home_area? ? -50 : 10
  end

  def movement_score
    # 直近60分5m以内なら40ポイント、30分5m以内なら25ポイント
    if recent_inactive?(60, 5)
      40
    elsif recent_inactive?(30, 5)
      25
    else
      0
    end
  end

  def temperature_score
    temp = @safety_log.weather_temp
    return 0 if temp.nil?

    if temp >= 35
      50
    elsif temp >= 30 || temp <= 5
      30
    else
      0
    end
  end

  def battery_score
    case @safety_log.battery_level.to_i
    when 0..10  then 20
    when 11..20 then 10
    when 51..100 then -10
    else 0
    end
  end

  def gps_accuracy_score
    acc = @safety_log.gps_accuracy
    return 0 if acc.nil?

    acc > 100 ? 15 : 0
  end

  def location_reasons
    return [] unless home_location_present?

    score = location_score
    return [] if score.zero?

    # in_home_area (-50) はポジティブな理由なので返さない
    score == -50 ? [] : ["outside_home"]
  end

  def movement_reasons
    case movement_score
    # 60分不動
    when 40 then ["long_inactive"]
    # 30分不動
    when 25 then ["short_inactive"]
    else []
    end
  end

  def temperature_reasons
    return [] unless temperature_score.positive?

    temp = @safety_log.weather_temp
    reasons = []
    reasons << "high_temperature" if temp >= 35
    reasons << "moderate_heat" if temp >= 30 && temp < 35
    reasons << "low_temperature" if temp <= 5
    reasons
  end

  def battery_reasons
    case battery_score
    when 20 then ["low_battery"]
    when 10 then ["battery_caution"]
    # battery_ok (-10) はリスク理由ではないので空配列を返す
    else []
    end
  end

  # GPS精度が悪い場合
  def gps_reasons
    gps_accuracy_score.positive? ? ["poor_gps_accuracy"] : []
  end
end
