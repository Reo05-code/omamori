# config/initializers/resend.rb

# Resend API キーの設定
Resend.api_key = ENV['RESEND_API_KEY']

# Rails Action Mailer 統合の設定
if Rails.env.production? || Rails.env.staging?
  Rails.application.config.action_mailer.delivery_method = :resend
end
