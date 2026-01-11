# frozen_string_literal: true

module Api
  module V1
    class OrganizationAlertSerializer
      def initialize(alert)
        @alert = alert
      end

      def as_json(*)
        {
          id: @alert.id,
          work_session_id: @alert.work_session_id,
          alert_type: @alert.alert_type,
          severity: @alert.severity,
          status: @alert.status,
          safety_log_id: @alert.safety_log_id,
          handled_by_user_id: @alert.handled_by_user_id,
          resolved_at: @alert.resolved_at&.iso8601,
          created_at: @alert.created_at&.iso8601,
          updated_at: @alert.updated_at&.iso8601,
          work_session: serialize_work_session
        }
      end

      private

      def serialize_work_session
        ws = @alert.work_session
        ws && { id: ws.id, user: serialize_user(ws.user) }
      end

      def serialize_user(user)
        user && { id: user.id, name: user.name, email: user.email }
      end
    end
  end
end
