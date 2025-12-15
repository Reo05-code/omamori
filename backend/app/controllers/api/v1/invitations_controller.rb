module Api
  module V1
    class InvitationsController < ApplicationController
      before_action :set_organization, only: %i[index create]
      before_action :require_admin!, only: %i[index create]
      before_action :authenticate_user!, only: %i[accept]

      def index
        invitations = @organization.invitations.where(accepted_at: nil).includes(:inviter)

        render json: invitations.map { |inv| Api::V1::InvitationSerializer.new(inv).as_json }
      end

      def create
        # role を正規化して無効なら 422 を返す
        norm_role = Membership.normalize_role(invitation_params[:role])
        unless norm_role.present?
          render json: { errors: [I18n.t("api.v1.invitations.error.invalid_role")] }, status: :unprocessable_entity
          return
        end

        invitation = @organization.invitations.create!(invitation_params.merge(inviter: current_user, role: norm_role))
        render json: Api::V1::InvitationSerializer.new(invitation).as_json,
               status: :created,
               # show がルーティングにないため一覧パスを location に設定
               location: api_v1_organization_invitations_path(@organization)
      rescue ActiveRecord::RecordInvalid => e
        render json: { errors: e.record.errors.full_messages.presence || [I18n.t("api.v1.invitations.error.create")] },
               status: :unprocessable_entity
      end

      def accept
        invitation = Invitation.pending.find_by!(token: params[:token])

        # Invitation モデルに受諾ロジックを委譲
        result = invitation.accept_by(current_user)

        if result.success
          render json: { message: I18n.t("api.v1.invitations.accepted"), membership: Api::V1::MembershipSerializer.new(result.membership).as_json }
          return
        end

        case result.error_key
        when :invalid_token
          render json: { error: I18n.t("api.v1.invitations.error.invalid_token") }, status: :not_found
        when :email_mismatch
          render json: { error: I18n.t("api.v1.invitations.error.email_mismatch") }, status: :forbidden
        when :already_member
          render json: { error: I18n.t("api.v1.invitations.error.already_member") }, status: :conflict
        when :organization_missing
          render json: { error: I18n.t("api.v1.invitations.error.organization_missing") }, status: :unprocessable_entity
        when :invalid_membership
          render json: { errors: [I18n.t("api.v1.invitations.error.create")] }, status: :unprocessable_entity
        else
          render json: { error: I18n.t("api.v1.invitations.error.create") }, status: :unprocessable_entity
        end
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
