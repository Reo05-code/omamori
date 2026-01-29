# frozen_string_literal: true

class ApplicationMailer < ActionMailer::Base
  default from: ENV.fetch("RESEND_FROM_EMAIL", "OmamoriWorker <noreply@omamoriworker.com>")
  layout "mailer"
end
