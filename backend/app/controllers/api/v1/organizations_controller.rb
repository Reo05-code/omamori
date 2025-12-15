module Api
  module V1
    class OrganizationsController < ApplicationController
      before_action :authenticate_user!

      def index
        orgs = current_user.organizations

        render json: orgs.map { |o| Api::V1::OrganizationSerializer.new(o).as_json }
      end

      def show
        organization = current_user.organizations.find(params[:id])
        render json: Api::V1::OrganizationSerializer.new(organization).as_json
      rescue ActiveRecord::RecordNotFound
        render json: { error: I18n.t("api.v1.organizations.not_found") }, status: :not_found
      end

      def create
        ActiveRecord::Base.transaction do
          organization = Organization.create!(organization_params)
          Membership.create!(
            organization: organization,
            user: current_user,
            role: :admin
          )
             render json: Api::V1::OrganizationSerializer.new(organization).as_json,
               status: :created,
               location: api_v1_organization_path(organization)
        end
      rescue ActiveRecord::RecordInvalid => e
        render json: { errors: e.record.errors.full_messages.presence || [I18n.t("api.v1.organizations.error.create")] },
               status: :unprocessable_entity
      end

      private

      def organization_params
        params.require(:organization).permit(:name)
      end
    end
  end
end
