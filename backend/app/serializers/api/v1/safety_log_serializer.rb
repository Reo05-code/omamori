# frozen_string_literal: true

module Api
  module V1
    # SafetyLog のシリアライザ（API レスポンス用）
    # lonlat（geography型）を latitude/longitude に展開して返す
    class SafetyLogSerializer
      def initialize(safety_log)
        @safety_log = safety_log
      end

      def as_json
        {
          id: @safety_log.id,
          work_session_id: @safety_log.work_session_id,
          logged_at: @safety_log.logged_at&.iso8601,
          latitude: @safety_log.latitude,
          longitude: @safety_log.longitude,
          battery_level: @safety_log.battery_level,
          trigger_type: @safety_log.trigger_type,
          gps_accuracy: @safety_log.gps_accuracy,
          weather_temp: @safety_log.weather_temp,
          weather_condition: @safety_log.weather_condition,
          is_offline_sync: @safety_log.is_offline_sync
        }.compact
      end
    end
  end
end
