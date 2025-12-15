module Api
  module V1
    class InvitationsController < ApplicationController
      # require authentication for all actions, including accept
      before_action :authenticate_user!, except: %i[accept]
      before_action :set_organization, only: %i[index create]
      before_action :require_admin!, only: %i[index create]

      def index
        invitations = @organization.invitations.where(accepted_at: nil).includes(:inviter)

        render json: invitations.map { |inv| Api::V1::InvitationSerializer.new(inv).as_json }
      end

      def create
        invitation = @organization.invitations.new(invitation_params)
        invitation.inviter = current_user
        invitation.save!
         render json: Api::V1::InvitationSerializer.new(invitation).as_json,
           status: :created,
          #  showがルーティングにないため一覧パスをlocation設定
           location: api_v1_organization_invitations_path(@organization)
      rescue ActiveRecord::RecordInvalid => e
        render json: { errors: e.record.errors.full_messages.presence || [I18n.t("api.v1.invitations.error.create")] },
               status: :unprocessable_entity
      end

      def accept
        invitation = Invitation.pending.find_by!(token: params[:token])

        ActiveRecord::Base.transaction do
          Membership.create!(
            organization: invitation.organization,
            user: current_user,
            role: invitation.role
          )
          invitation.update!(accepted_at: Time.current)
        end

        render json: { message: I18n.t("api.v1.invitations.accepted") }
      rescue ActiveRecord::RecordNotFound
        render json: { error: I18n.t("api.v1.invitations.error.invalid_token") }, status: :not_found
      end

      private

      def set_organization
        @organization = current_user.organizations.find(params[:organization_id])
      end

      def require_admin!
        membership = @organization.memberships.find_by(user: current_user)
        return if membership&.admin?

        render(json: { error: I18n.t("api.v1.organizations.error.forbidden") },
               status: :forbidden)
      end

      def invitation_params
        params.require(:invitation).permit(:invited_email, :role)
      end
    end
  end
end
