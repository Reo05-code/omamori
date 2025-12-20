module Api
  module V1
    # Lightweight serializer for Invitation
    class InvitationSerializer
      def initialize(invitation)
        @invitation = invitation
      end

      def as_json(*)
        inviter = @invitation.inviter

        data = {
          id: @invitation.id,
          invited_email: @invitation.invited_email,
          role: @invitation.role,
          inviter: Api::V1::InviterSerializer.new(inviter).as_json,
          expires_at: @invitation.expires_at
        }
        data[:token] = @invitation.token if Rails.env.local?

        data
      end
    end
  end
end
