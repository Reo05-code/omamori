# frozen_string_literal: true

class InvitationMailer < ApplicationMailer
  # 招待メールを送信
  # @param invitation [Invitation] 招待オブジェクト
  def invite(invitation)
    @invitation = invitation
    @organization = invitation.organization
    @inviter = invitation.inviter
    @accept_url = "#{ENV.fetch('FRONTEND_URL', nil)}/accept-invitation?token=#{invitation.token}"
    @role_name = invitation.role == "admin" ? "管理者" : "メンバー"

    Rails.logger.info "[InvitationMailer] Sending invitation email to #{invitation.invited_email}"

    mail(
      to: invitation.invited_email,
      subject: "【OmamoriWorker】#{@organization.name} への招待"
    )
  end
end
