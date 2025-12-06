# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Auth::Sessions" do
  # rubocop:disable RSpec/ContextWording
  let(:user) { create(:user, email: "test@example.com", password: "password123") }

  describe "POST /api/v1/auth/sign_in (ログイン)" do
    context "有効な認証情報の場合" do
      it "ログインに成功する" do
        post "/api/v1/auth/sign_in", params: { email: user.email, password: "password123" }, as: :json

        expect(response).to have_http_status(:ok)
        json = response.parsed_body
        expect(json["status"]).to eq("success")
        expect(json["data"]["email"]).to eq(user.email)
      end

      it "認証ヘッダーを返す" do
        post "/api/v1/auth/sign_in", params: { email: user.email, password: "password123" }, as: :json

        expect(response.headers["access-token"]).to be_present
        expect(response.headers["client"]).to be_present
        expect(response.headers["uid"]).to eq(user.email)
      end

      it "httpOnly クッキーにトークンを設定する" do
        post "/api/v1/auth/sign_in", params: { email: user.email, password: "password123" }, as: :json

        set_cookie = response.headers['Set-Cookie']
        expect(set_cookie).to be_present
        # クッキー文字列に各トークン名が含まれることを確認
        expect(set_cookie).to include('access_token=')
        expect(set_cookie).to include('client=')
        expect(set_cookie).to include('uid=')
      end

      it "ユーザー情報を返す" do
        post "/api/v1/auth/sign_in", params: { email: user.email, password: "password123" }, as: :json

        json = response.parsed_body
        expect(json["data"]["id"]).to eq(user.id)
        expect(json["data"]["name"]).to eq(user.name)
        expect(json["data"]["email"]).to eq(user.email)
        expect(json["data"]["role"]).to eq(user.role)
      end
    end

    context "無効な認証情報の場合" do
      it "パスワードが間違っている場合、401エラーを返す" do
        post "/api/v1/auth/sign_in", params: { email: user.email, password: "wrongpassword" }, as: :json

        expect(response).to have_http_status(:unauthorized)
        json = response.parsed_body
        expect(json["status"]).to eq("error")
        expect(json["errors"]).to be_present
      end

      it "メールアドレスが存在しない場合、401エラーを返す" do
        post "/api/v1/auth/sign_in", params: { email: "nonexistent@example.com", password: "password123" }, as: :json

        expect(response).to have_http_status(:unauthorized)
        json = response.parsed_body
        expect(json["status"]).to eq("error")
      end
    end
  end

  describe "DELETE /api/v1/auth/sign_out (ログアウト)" do
    let(:auth_headers) { user.create_new_auth_token }

    context "認証済みの場合" do
      it "ログアウトに成功する" do
        delete "/api/v1/auth/sign_out", headers: auth_headers, as: :json

        expect(response).to have_http_status(:ok)
        json = response.parsed_body
        expect(json["status"]).to eq("success")
      end
    end

    context "未認証の場合" do
      it "401エラーを返す" do
        delete "/api/v1/auth/sign_out", as: :json

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end

# rubocop:enable RSpec/ContextWording

RSpec.describe "Api::V1::Auth::TokenValidations" do
  let(:user) { create(:user, email: "test@example.com", password: "password123") }

  describe "GET /api/v1/auth/validate_token (トークン検証)" do
    it "クッキー送信でトークン検証に成功する" do
      # まずサインインして Set-Cookie を取得
      post "/api/v1/auth/sign_in", params: { email: user.email, password: "password123" }, as: :json
      expect(response).to have_http_status(:ok)

      set_cookie = response.headers['Set-Cookie']
      expect(set_cookie).to be_present

      # Cookie ヘッダー用に安全に name=value のみを抜き出して組み立てる
      cookie_header = set_cookie.split("\n")
            .map { |c| c[/^[^;]+/] }
            .join('; ')

      get "/api/v1/auth/validate_token", headers: { 'Cookie' => cookie_header }, as: :json

      expect(response).to have_http_status(:ok)
      json = response.parsed_body
      expect(json["status"]).to eq("success")
      expect(json["data"]["email"]).to eq(user.email)
    end
  end
end
