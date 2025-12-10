# frozen_string_literal: true

# rubocop:disable RSpec/ContextWording
require "rails_helper"

RSpec.describe "Api::V1::Auth::Passwords" do
  let(:user) { create(:user, email: "test@example.com") }

  before do
    ActionMailer::Base.deliveries.clear
  end

  describe "POST /api/v1/auth/password" do
    let(:valid_params) do
      {
        email: user.email,
        redirect_url: "http://localhost:3000/reset-password"
      }
    end

    context "存在するメールアドレスの場合" do
      it "成功レスポンスを返す" do
        post_with_csrf "/api/v1/auth/password", params: valid_params, as: :json

        expect(response).to have_http_status(:ok)
        expect(response.parsed_body["status"]).to eq("success")
      end

      it "パスワードリセットトークンを生成する" do
        expect do
          post_with_csrf "/api/v1/auth/password", params: valid_params, as: :json
        end.to change { user.reload.reset_password_token }.from(nil)
      end

      it "reset_password_sent_at が更新される" do
        expect do
          post_with_csrf "/api/v1/auth/password", params: valid_params, as: :json
        end.to change { user.reload.reset_password_sent_at }.from(nil)
      end

      it "メール送信がトリガーされる" do
        expect do
          post_with_csrf "/api/v1/auth/password", params: valid_params, as: :json
        end.to change { ActionMailer::Base.deliveries.size }.by(1)

        mail = ActionMailer::Base.deliveries.last
        expect(mail.to).to eq([user.email])
      end

      it 'メール内のリンクは許可された redirect_url のホストを使う' do
        allowed = ENV.fetch('FRONTEND_BASE_URL', 'http://localhost:3000')

        post_with_csrf "/api/v1/auth/password", params: { email: user.email, redirect_url: "#{allowed}/password/reset" }, as: :json

        expect(response).to have_http_status(:ok)
        mail = ActionMailer::Base.deliveries.last
        body = mail.body.raw_source
        url = body[/href="([^"]+)"/, 1]
        expect(url).to be_present
        expect(URI.parse(url).host).to eq(URI.parse(allowed).host)
      end

      it '不正な redirect_url は FRONTEND_BASE_URL にフォールバックする' do
        disallowed = 'https://attacker.example.com/password/reset'
        fallback = ENV.fetch('FRONTEND_BASE_URL', 'http://localhost:3000')

        post_with_csrf "/api/v1/auth/password", params: { email: user.email, redirect_url: disallowed }, as: :json

        expect(response).to have_http_status(:ok)
        mail = ActionMailer::Base.deliveries.last
        body = mail.body.raw_source
        url = body[/href="([^"]+)"/, 1]
        expect(url).to be_present
        expect(URI.parse(url).host).to eq(URI.parse(fallback).host)
      end
    end

    context "存在しないメールアドレスの場合" do
      it "not_found を返す" do
        post_with_csrf "/api/v1/auth/password", params: {
          email: "none@example.com",
          redirect_url: "http://localhost:3000/reset-password"
        }, as: :json

        expect(response).to have_http_status(:not_found)
        expect(ActionMailer::Base.deliveries.size).to eq(0)
      end
    end

    context "redirect_url がない場合" do
      it "unauthorized を返す" do
        post_with_csrf "/api/v1/auth/password", params: { email: user.email }, as: :json

        expect(response).to have_http_status(:unauthorized)
        expect(ActionMailer::Base.deliveries.size).to eq(0)
      end
    end
  end

  describe "PUT /api/v1/auth/password (パスワード変更)" do
    let(:auth_headers) { user.create_new_auth_token }

    context "認証済みの場合" do
      it "パスワードを変更できる" do
        put_with_csrf "/api/v1/auth/password", params: {
          password: "newpassword123",
          password_confirmation: "newpassword123"
        }, headers: auth_headers, as: :json

        expect(response).to have_http_status(:ok)
        json = response.parsed_body
        expect(json["status"]).to eq("success")
      end

      it "新しいパスワードでログインできる" do
        put_with_csrf "/api/v1/auth/password", params: {
          password: "newpassword123",
          password_confirmation: "newpassword123"
        }, headers: auth_headers, as: :json

        # 新しいパスワードでログイン
        post_with_csrf "/api/v1/auth/sign_in", params: {
          email: user.email,
          password: "newpassword123"
        }, as: :json

        expect(response).to have_http_status(:ok)
      end
    end

    context "パスワードが一致しない場合" do
      it "エラーレスポンスを返す" do
        put_with_csrf "/api/v1/auth/password", params: {
          password: "newpassword123",
          password_confirmation: "differentpassword"
        }, headers: auth_headers, as: :json

        expect(response).to have_http_status(:unprocessable_entity)
        json = response.parsed_body
        expect(json["status"]).to eq("error")
      end
    end

    context "未認証の場合" do
      it "401エラーを返す" do
        put_with_csrf "/api/v1/auth/password", params: {
          password: "newpassword123",
          password_confirmation: "newpassword123"
        }, as: :json

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end

# rubocop:enable RSpec/ContextWording
