module Api
  module V1
    class OrganizationsController < ApplicationController
      before_action :authenticate_user!

      def index
        # current_user の所属する組織一覧を返す
        # シリアライザを使って返却属性を限定し、モデル拡張で機密カラムが追加されても誤って露出しないようにする
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
        organization = create_organization_with_membership(organization_params)
        render json: Api::V1::OrganizationSerializer.new(organization).as_json,
               status: :created,
               location: api_v1_organization_path(organization)
      rescue ActiveRecord::RecordInvalid => e
        # バリデーションエラーは詳細メッセージを優先して返し、なければ I18n の汎用メッセージへフォールバックする
        errs = e.record.errors.full_messages.presence || [I18n.t("api.v1.organizations.error.create")]
        render json: { errors: errs }, status: :unprocessable_content
      end

      def update
        organization = current_user.organizations.find(params[:id])
        return unless authorize_organization_update?(organization)

        update_organization_and_render(organization)
      rescue ActiveRecord::RecordNotFound
        render_not_found
      rescue ActiveRecord::RecordInvalid => e
        render_validation_errors(e)
      end

      private

      def authorize_organization_update?(organization)
        result = OrganizationPolicy.new(current_user, organization).update
        return true if result.allowed?

        render json: { error: I18n.t("api.v1.organizations.errors.update_forbidden") }, status: :forbidden
        false
      end

      def update_organization_and_render(organization)
        organization.update!(organization_params)
        render json: Api::V1::OrganizationSerializer.new(organization).as_json
      end

      def render_not_found
        render json: { error: I18n.t("api.v1.organizations.not_found") }, status: :not_found
      end

      def render_validation_errors(error)
        messages = error.record.errors.full_messages.presence || [I18n.t("api.v1.organizations.errors.update")]
        render json: { errors: messages }, status: :unprocessable_content
      end

      def create_organization_with_membership(params)
        ActiveRecord::Base.transaction do
          organization = Organization.create!(params)
          Membership.create!(organization: organization, user: current_user, role: :admin)
          current_user.update!(onboarded: true)
          organization
        end
      end

      def organization_params
        params.require(:organization).permit(:name)
      end
    end
  end
end
