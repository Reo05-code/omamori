# frozen_string_literal: true

module SafetyLogs
  class CreateService
    class Forbidden < StandardError; end

    def initialize(work_session:, actor:, attributes:)
      @work_session = work_session
      @actor = actor
      @attributes = attributes
    end

    def call!
      raise Forbidden, "作業セッションの所有者のみログを送信できます" unless owner?

      attributes = prepare_attributes
      safety_log = build_safety_log(attributes)
      assessment = save_with_assessment(safety_log)

      build_response(safety_log, assessment)
    end

    private

    def owner?
      @work_session.user_id == @actor.id
    end

    def prepare_attributes
      attributes = @attributes.deep_symbolize_keys
      attributes.except!(:weather_temp, :weather_condition)
      merge_weather_data(attributes)
    end

    def merge_weather_data(attributes)
      weather = WeatherService.fetch_weather(attributes[:latitude], attributes[:longitude])
      if weather
        attributes[:weather_temp] = weather[:temp]
        attributes[:weather_condition] = weather[:condition]
      end
      attributes
    end

    def build_safety_log(attributes)
      safety_log = @work_session.safety_logs.build(attributes)
      safety_log.logged_at ||= Time.current
      safety_log
    end

    def save_with_assessment(safety_log)
      assessment = nil
      ActiveRecord::Base.transaction do
        safety_log.save!
        assessment = RiskAssessmentService.new(safety_log).call
      end
      assessment
    end

    def build_response(safety_log, assessment)
      undo_expires_at = safety_log.undoable_trigger_type? ? safety_log.undo_expires_at&.iso8601 : nil
      {
        safety_log: safety_log,
        assessment: assessment,
        undo_expires_at: undo_expires_at
      }
    end
  end
end
