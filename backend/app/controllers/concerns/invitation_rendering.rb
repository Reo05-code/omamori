module InvitationRendering
  extend ActiveSupport::Concern

  private

  def render_invitation_preview(invitation)
    render json: invitation_preview_payload(invitation), status: :ok
  end

  def invitation_preview_payload(invitation)
    {
      status: invitation_preview_status(invitation),
      organization_name: invitation.organization&.name,
      organization_id: invitation.organization_id,
      role: invitation.role,
      invited_email: invitation.invited_email
    }
  end

  def invitation_preview_status(invitation)
    return "accepted" if invitation.accepted_at.present?
    return "expired" if invitation.expires_at.present? && invitation.expires_at <= Time.current

    "pending"
  end

  def render_invitation_not_found
    render json: { error: I18n.t("api.v1.invitations.error.invalid_token") }, status: :not_found
  end
end
