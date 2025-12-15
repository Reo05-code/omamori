module Api
  module V1
    # Minimal user/Inviter serializer used inside Invitation responses
    class InviterSerializer
      def initialize(user)
        @user = user
      end

      def as_json(*)
        return nil unless @user

        {
          id: @user.id,
          name: @user.name,
          email: @user.email
        }
      end
    end
  end
end
