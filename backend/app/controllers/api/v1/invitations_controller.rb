module Api
  module V1
    class InvitationsController < ApplicationController
      before_action :set_organization, only: %i[index create destroy]
      before_action :require_admin!, only: %i[index create destroy]

      def index
        invitations = @organization.invitations.where(accepted_at: nil).includes(:inviter)

        render json: invitations.map { |inv| Api::V1::InvitationSerializer.new(inv).as_json }
      end

      def create
        # role は params から取り出して正規化する（Strong params に role を含めない）
        raw_role = params.dig(:invitation, :role)
        norm_role = normalize_role_or_render(raw_role)
        return if norm_role.blank?

        invitation = create_invitation(norm_role)
        send_invitation_email(invitation)

        render json: Api::V1::InvitationSerializer.new(invitation).as_json,
               status: :created,
               location: api_v1_organization_invitations_path(@organization)
      rescue ActiveRecord::RecordInvalid => e
        render json: { errors: e.record.errors.full_messages.presence || [I18n.t("api.v1.invitations.error.create")] },
               status: :unprocessable_content
      end

      # pending な招待を削除する
      def destroy
        invitation = @organization.invitations.pending.find(params[:id])
        invitation.destroy!
        render json: { message: I18n.t("api.v1.invitations.destroy_success") }, status: :ok
      rescue ActiveRecord::RecordNotFound
        render json: { error: I18n.t("api.v1.invitations.error.not_found") }, status: :not_found
      end

      def accept
        invitation = Invitation.pending.find_by!(token: params[:token])

        # 未認証ユーザーでも承認可能（トークンのみで検証）
        result = invitation.accept!

        handle_accept_result(result)
      rescue ActiveRecord::RecordNotFound
        render json: { error: I18n.t("api.v1.invitations.error.invalid_token") }, status: :not_found
      end

      private

      def set_organization
        @organization = current_user.organizations.find(params[:organization_id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: I18n.t("api.v1.organizations.not_found") }, status: :not_found
      end

      def require_admin!
        membership = @organization.memberships.find_by(user: current_user)
        return if membership&.admin?

        render(json:
        { error: I18n.t("api.v1.organizations.error.forbidden") },
               status: :forbidden)
      end

      def invitation_params
        params.require(:invitation).permit(:invited_email)
      end

      def normalize_role_or_render(role)
        # role は params から直接取らず、このヘルパに渡して正規化する
        norm_role = Membership.normalize_role(role)
        if norm_role.blank?
          render json: { errors: [I18n.t("api.v1.invitations.error.invalid_role")] }, status: :unprocessable_content
          return nil
        end

        norm_role
      end

      def create_invitation(norm_role)
        @organization.invitations.create!(invitation_params.merge(inviter: current_user, role: norm_role))
      end

      def send_invitation_email(invitation)
        # Render 無料枠では Redis が使えないため、本番環境では同期送信
        # 開発環境でも letter_opener の動作確認のため同期送信を使用
        InvitationMailer.invite(invitation).deliver_now
      end

      def handle_accept_result(result)
        if result.success
          render_accept_success(result.membership)
          return
        end

        if result.error_key == :validation_errors
          render json: { errors: result.errors.presence || [I18n.t("api.v1.invitations.error.create")] },
                 status: :unprocessable_content and return
        end

        mapping = {
          invalid_token: [:not_found, "api.v1.invitations.error.invalid_token"],
          email_mismatch: [:forbidden, "api.v1.invitations.error.email_mismatch"],
          already_member: [:conflict, "api.v1.invitations.error.already_member"]
        }

        status_sym, i18n_key = mapping[result.error_key] || [:unprocessable_entity, "api.v1.invitations.error.create"]
        render json: { error: I18n.t(i18n_key) }, status: status_sym
      end

      def render_accept_success(membership)
        # membership が nil の場合（未認証での承認）はメッセージのみ返す
        if membership.nil?
          render json: { message: I18n.t("api.v1.invitations.accepted") }, status: :ok
        else
          render json: { message: I18n.t("api.v1.invitations.accepted"), membership: Api::V1::MembershipSerializer.new(membership).as_json }
        end
      end
    end
  end
end
