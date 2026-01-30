# frozen_string_literal: true

class UserMailer < Devise::Mailer
  include Devise::Controllers::UrlHelpers

  default template_path: "user_mailer"

  # パスワードリセット案内メール
  def reset_password_instructions(record, token, opts = {})
    @resource = record

    # devise_token_auth では reset_password_token が渡される
    # フロントエンドは access-token, client, uid の3つのパラメータを期待している

    # 新しいトークンセットを生成（パスワードリセット用）
    token_data = record.create_token
    access_token = token_data.token
    client_id = token_data.client

    record.save!

    base_url = ENV.fetch("FRONTEND_BASE_URL", "http://localhost:3000")

    # フロントエンド ResetForm.tsx が期待する形式でURLを生成
    # ?access-token=<token>&client=<client_id>&uid=<email>
    @reset_url = "#{base_url}/password/reset?access-token=#{access_token}&client=#{client_id}&uid=#{ERB::Util.url_encode(record.email)}"
    @token = access_token

    Rails.logger.info "[UserMailer] Sending password reset email to #{record.email} with client=#{client_id}"

    opts[:subject] = "【OmamoriWorker】パスワードリセット"
    super
  end
end
