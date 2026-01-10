module Api
  module V1
    class MembershipSerializer
      def initialize(membership, active_work_sessions_by_user_id: nil)
        @membership = membership
        @active_work_sessions_by_user_id = active_work_sessions_by_user_id
      end

      def as_json(*)
        user = @membership.user
        active_work_session = @active_work_sessions_by_user_id&.fetch(@membership.user_id, nil)

        {
          id: @membership.id,
          user_id: @membership.user_id,
          # フロントでのメンバー選択表示に利用する（要件: email ではなく name を表示）
          name: user&.name,
          email: user&.email,
          role: @membership.role,
          active_work_session: {
            active: active_work_session.present?,
            id: active_work_session&.id
          }
        }
      end
    end
  end
end
