module Api
  module V1
    class MembershipsController < ApplicationController
      before_action :authenticate_user!
      before_action :set_organization
      before_action :require_admin!, only: %i[update destroy]

      def index
        memberships = @organization.memberships.includes(:user)
        render json: memberships.map { |m| Api::V1::MembershipSerializer.new(m).as_json }
      end

      def update
        membership = @organization.memberships.find(params[:id])
        membership.update!(membership_params)
        render json: Api::V1::MembershipSerializer.new(membership).as_json
      rescue ActiveRecord::RecordInvalid => e
        render json: { errors: e.record.errors.full_messages.presence || [I18n.t("api.v1.memberships.error.update")] },
               status: :unprocessable_entity
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
        return if membership&.admin?

        render(json: { error: I18n.t("api.v1.organizations.error.forbidden") },
               status: :forbidden)
      end

      def membership_params
        params.require(:membership).permit(:role)
      end
    end
  end
end
