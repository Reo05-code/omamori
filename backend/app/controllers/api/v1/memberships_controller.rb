module Api
  module V1
    class MembershipsController < ApplicationController
      before_action :authenticate_user!
      before_action :set_organization
      before_action :set_current_membership, only: %i[update destroy]

      def index
        memberships = @organization.memberships.includes(:user)
        render json: memberships.map { |m| Api::V1::MembershipSerializer.new(m).as_json }
      end

      def update
        membership = @organization.memberships.find(params[:id])
        # ポリシーは理由付きの結果を返す。Controller は結果（allowed?, error_key）だけを見てレスポンスする。
        result = MembershipPolicy.new(current_user, membership, @current_membership)
                                   .update(membership_params[:role])

        unless result.allowed?
          render json: { error: error_message_for(result.error_key) }, status: :forbidden
          return
        end

        # trueなら更新処理実行
        membership.update!(membership_params)
        render json: Api::V1::MembershipSerializer.new(membership).as_json
      rescue ActiveRecord::RecordInvalid => e
        render json: { errors: e.record.errors.full_messages.presence || [I18n.t("api.v1.memberships.error.update")] },
               status: :unprocessable_entity
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
      end

      # 現在ユーザーの membership を1度取得して保持する
      def set_current_membership
        @current_membership = @organization.memberships.find_by(user: current_user)
      end

      def membership_params
        params.require(:membership).permit(:role)
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
