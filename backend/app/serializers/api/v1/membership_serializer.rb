module Api
  module V1
    # Lightweight serializer for Membership
    class MembershipSerializer
      def initialize(membership)
        @membership = membership
      end

      def as_json(*)
        user = @membership.user

        {
          id: @membership.id,
          user_id: @membership.user_id,
          email: user&.email,
          role: @membership.role
        }
      end
    end
  end
end
