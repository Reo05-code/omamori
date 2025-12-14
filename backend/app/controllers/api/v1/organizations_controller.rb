module Api
  module V1
    class OrganizationsController < ApplicationController
      before_action :authenticate_user!

      def index
        render json: current_user.organizations
      end

      def create
        ActiveRecord::Base.transaction do
          organization = Organization.create!(organization_params)
          Membership.create!(
            organization: organization,
            user: current_user,
            role: :admin
          )
          render json: organization, status: :created
        end
      rescue ActiveRecord::RecordInvalid => e
        render json: { errors: e.record.errors.full_messages }, status: :unprocessable_entity
      end

      def show
        organization = current_user.organizations.find(params[:id])
        render json: organization
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Not Found' }, status: :not_found
      end

      private

      def organization_params
        params.require(:organization).permit(:name)
      end
    end
  end
end
