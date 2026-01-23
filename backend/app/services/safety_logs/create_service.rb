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

      safety_log = @work_session.safety_logs.build(@attributes)
      safety_log.logged_at ||= Time.current

      assessment = nil
      ActiveRecord::Base.transaction do
        safety_log.save!
        assessment = RiskAssessmentService.new(safety_log).call
      end

      undo_expires_at = safety_log.undoable_trigger_type? ? safety_log.undo_expires_at&.iso8601 : nil

      {
        safety_log: safety_log,
        assessment: assessment,
        undo_expires_at: undo_expires_at
      }
    end

    private

    def owner?
      @work_session.user_id == @actor.id
    end
  end
end
