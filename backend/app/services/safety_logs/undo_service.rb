# frozen_string_literal: true

module SafetyLogs
  class UndoService
    class Forbidden < StandardError; end
    class NotUndoable < StandardError; end
    class Expired < StandardError; end

    def initialize(work_session:, safety_log_id:, actor:)
      @work_session = work_session
      @safety_log_id = safety_log_id
      @actor = actor
    end

    def call!
      raise Forbidden, "作業セッションの所有者のみログを削除できます" unless owner?

      safety_log = @work_session.safety_logs.find(@safety_log_id)

      raise NotUndoable, "このログは取り消しできません" unless safety_log.undoable_trigger_type?
      raise Expired, "取り消し可能な時間を過ぎています" unless safety_log.undoable_now?

      safety_log.destroy!

      safety_log
    end

    private

    def owner?
      @work_session.user_id == @actor.id
    end
  end
end
