module Api
  module V1
    class MembershipsController < ApplicationController
      before_action :authenticate_user!
      before_action :set_organization
      before_action :require_admin!, only: %i[update destroy]

      def index
        memberships = @organization.memberships.includes(:user)
        render json: memberships.map { |m|
          {
            id: m.id,
            user_id: m.user_id,
            email: m.user.email,
            role: m.role
          }
        }
      end

      def update
        membership = @organization.memberships.find(params[:id])
        membership.update!(membership_params)
        render json: membership
      rescue ActiveRecord::RecordInvalid => e
        render json: { errors: e.record.errors.full_messages.presence || [I18n.t("api.v1.memberships.error.update")] }, status: :unprocessable_entity
      end

      def destroy
        membership = @organization.memberships.find(params[:id])
        membership.destroy!
        render json: { message: I18n.t("api.v1.memberships.destroy_success") }
      end

      private

      def set_organization
        @organization = current_user.organizations.find(params[:organization_id])
      end

      def require_admin!
        membership = @organization.memberships.find_by(user: current_user)
        render(json: { error: I18n.t("api.v1.organizations.error.forbidden") }, status: :forbidden) unless membership&.admin?
      end

      def membership_params
        params.require(:membership).permit(:role)
      end
    end
  end
end
