# frozen_string_literal: true

module Api
  module V1
    # show 専用の詳細な WorkSession 表現（監視ジョブ情報を含む）
    class WorkSessionDetailSerializer
      def initialize(work_session)
        @work_session = work_session
      end

      def as_json
        base_attributes.merge(monitoring_job: monitoring_job_data).compact
      end

      private

      def base_attributes
        {
          id: @work_session.id,
          user_id: @work_session.user_id,
          organization_id: @work_session.organization_id,
          status: @work_session.status,
          started_at: @work_session.started_at,
          ended_at: @work_session.ended_at,
          created_at: @work_session.created_at,
          updated_at: @work_session.updated_at
        }
      end

      def monitoring_job_data
        status = @work_session.monitoring_status
        scheduled_at = @work_session.scheduled_at

        # status が "none" であれば monitoring_job を返さない
        return nil if status == "none"

        {
          status: status,
          scheduled_at: scheduled_at
        }.compact
      end
    end
  end
end
