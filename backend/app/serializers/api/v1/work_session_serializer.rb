# frozen_string_literal: true

module Api
  module V1
    # 一覧・作成・更新・current 用の軽量な WorkSession 表現
    class WorkSessionSerializer
      def initialize(work_session)
        @work_session = work_session
      end

      def as_json
        {
          id: @work_session.id,
          user_id: @work_session.user_id,
          organization_id: @work_session.organization_id,
          created_by_user_id: @work_session.created_by_user_id,
          status: @work_session.status,
          started_at: @work_session.started_at,
          ended_at: @work_session.ended_at
        }.compact
      end
    end
  end
end
