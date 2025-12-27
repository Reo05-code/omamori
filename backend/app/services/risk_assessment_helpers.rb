# frozen_string_literal: true

module RiskAssessmentHelpers
  # home_location の存在確認
  def home_location_present?
    @safety_log.work_session&.user&.home_location.present?
  end

  # 自宅エリア内判定 (PostGIS ST_DWithin を利用)
  def in_home_area?
    user = @safety_log.work_session.user
    radius = user.home_radius || 50

    SafetyLog.where(id: @safety_log.id)
             .exists?(["ST_DWithin(lonlat::geography, ?::geography, ?)", user.home_location, radius])
  end

  # 直近 N 分の間、現在地から動いていないかを判定（60分で5メートル動いてなかったら＋40ポイントの設定にしてある）
  def recent_inactive?(minutes, threshold_meters)
    cutoff = @safety_log.logged_at - minutes.minutes

    recent_logs = @safety_log.work_session.safety_logs
                             .where(logged_at: cutoff..@safety_log.logged_at)
                             .where(gps_accuracy: ..50)
                             .select(:lonlat)

    return false if recent_logs.size < 2

    current_point = @safety_log.lonlat

    recent_logs.all? do |log|
      dist = log.lonlat.distance(current_point)
      dist < threshold_meters
    end
  end
end
