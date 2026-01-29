# frozen_string_literal: true

class UserMailer < Devise::Mailer
  include Devise::Controllers::UrlHelpers

  default template_path: "user_mailer"

  # パスワードリセット案内メール
  def reset_password_instructions(record, token, opts = {})
    @token = token
    @resource = record

    # FRONTEND_BASE_URL を使用（PasswordsController で sanitize された redirect_url ベース）
    @reset_url = "#{ENV.fetch('FRONTEND_BASE_URL', 'http://localhost:3000')}/password/reset?reset_password_token=#{token}"

    Rails.logger.info "[UserMailer] Sending password reset email to #{record.email}"

    opts[:subject] = "【OmamoriWorker】パスワードリセット"
    super
  end
end
