module Api
  module V1
    class MembershipsController < ApplicationController
      before_action :authenticate_user!
      before_action :set_organization
      before_action :set_current_membership, only: %i[index update destroy]

      def index
        unless @current_membership&.admin?
          render json: { error: error_message_for(:forbidden) }, status: :forbidden
          return
        end

        memberships = @organization.memberships.includes(:user)

        user_ids = memberships.map(&:user_id)

        active_work_sessions_by_user_id = WorkSession.active
                                                     .where(organization_id: @organization.id, user_id: user_ids)
                                                     .select(:id, :user_id)
                                                     .index_by(&:user_id)

        render json: memberships.map { |m|
          Api::V1::MembershipSerializer.new(m, active_work_sessions_by_user_id: active_work_sessions_by_user_id).as_json
        }
      end

      def update
        membership = @organization.memberships.find(params[:id])
        # ポリシーは理由付きの結果を返す。Controller は結果（allowed?, error_key）だけを見てレスポンスする。
        return if render_membership_update_forbidden?(membership)

        perform_membership_update(membership)
      rescue ActiveRecord::RecordInvalid => e
        render json: { errors: e.record.errors.full_messages.presence || [I18n.t("api.v1.memberships.error.update")] },
               status: :unprocessable_content
      end

      def destroy
        membership = @organization.memberships.find(params[:id])
        result = MembershipPolicy.new(current_user, membership, @current_membership).destroy

        unless result.allowed?
          render json: { error: error_message_for(result.error_key) }, status: :forbidden
          return
        end

        membership.destroy!
        render json: { message: I18n.t("api.v1.memberships.destroy_success") }
      end

      private

      def set_organization
        @organization = current_user.organizations.find(params[:organization_id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: I18n.t("api.v1.organizations.error.not_found") }, status: :not_found
      end

      # 現在ユーザーの membership を1度取得して保持する
      def set_current_membership
        @current_membership = @organization.memberships.find_by(user: current_user)
      end

      def membership_params
        # Do not permit :role directly to avoid mass-assignment warnings from Brakeman.
        # Role should be normalized via `role_param` and passed explicitly to update.
        params.require(:membership).permit
      end

      def role_param
        params.dig(:membership, :role)
      end

      def membership_update_result(membership)
        MembershipPolicy.new(current_user, membership, @current_membership).update(role_param)
      end

      def perform_membership_update(membership)
        norm_role = Membership.normalize_role(role_param)
        if norm_role.blank?
          render json: { errors: [I18n.t("api.v1.memberships.error.update")] }, status: :unprocessable_content
          return
        end

        membership.update!(role: norm_role)
        render json: Api::V1::MembershipSerializer.new(membership).as_json
      end

      def render_membership_update_forbidden?(membership)
        result = membership_update_result(membership)
        unless result.allowed?
          render json: { error: error_message_for(result.error_key) }, status: :forbidden
          return true
        end

        false
      end

      def error_message_for(error_key)
        case error_key
        when :cannot_demote_self
          I18n.t("api.v1.memberships.error.cannot_demote_self")
        when :last_admin
          I18n.t("api.v1.memberships.error.last_admin")
        else
          I18n.t("api.v1.organizations.error.forbidden")
        end
      end
    end
  end
end
