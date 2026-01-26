# frozen_string_literal: true

module Api
  module V1
    # SafetyLog のシリアライザ（API レスポンス用）
    # lonlat（geography型）を latitude/longitude に展開して返す
    class SafetyLogSerializer
      include WeatherHelper

      def initialize(safety_log_or_collection)
        @input = safety_log_or_collection
      end

      def as_json
        return @input.map { |log| serialize_one(log) } if collection?

        serialize_one(@input)
      end

      private

      def collection?
        @input.is_a?(Enumerable) && !@input.is_a?(SafetyLog)
      end

      def serialize_one(safety_log)
        result = {
          id: safety_log.id,
          work_session_id: safety_log.work_session_id,
          logged_at: safety_log.logged_at&.iso8601,
          latitude: safety_log.latitude,
          longitude: safety_log.longitude,
          battery_level: safety_log.battery_level,
          trigger_type: safety_log.trigger_type,
          gps_accuracy: safety_log.gps_accuracy,
          is_offline_sync: safety_log.is_offline_sync
        }

        # 天気データが存在する場合のみ含める
        if safety_log.weather_temp.present?
          result[:weather_temp] = safety_log.weather_temp
        end

        if safety_log.weather_condition.present?
          result[:weather_condition] = weather_condition_label(safety_log.weather_condition)
        end

        result
      end
    end
  end
end
