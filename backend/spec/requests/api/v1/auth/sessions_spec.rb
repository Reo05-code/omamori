# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Auth::Sessions" do
  let(:user) { create(:user, email: "test@example.com", password: "Password123", password_confirmation: "Password123") }

  describe "POST /api/v1/auth/sign_in (ログイン)" do
    context "有効な認証情報の場合" do
      it "ログインに成功する" do
        post "/api/v1/auth/sign_in", params: { email: user.email, password: "Password123" }, as: :json

        expect(response).to have_http_status(:ok)
        json = response.parsed_body
        expect(json["status"]).to eq("success")
        expect(json["data"]["email"]).to eq(user.email)
      end

      it "認証情報を返す（ヘッダーは公開せずクッキーに設定する）" do
        post "/api/v1/auth/sign_in", params: { email: user.email, password: "Password123" }, as: :json

        # サーバ側でヘッダーはクッキーへ移し、ヘッダー露出を消しているため
        # テストでは httpOnly クッキーが設定されていることを確認する
        expect(response.cookies["access_token"]).to be_present
        expect(response.cookies["client"]).to be_present
        # uid はサーバで暗号化しているため、レスポンスの cookie は暗号化済みの文字列
        # そのためここでは存在のみ確認する
        expect(response.cookies["uid"]).to be_present
      end

      it "ユーザー情報を返す" do
        post "/api/v1/auth/sign_in", params: { email: user.email, password: "Password123" }, as: :json

        json = response.parsed_body
        expect(json["data"]["id"]).to eq(user.id)
        expect(json["data"]["name"]).to eq(user.name)
        expect(json["data"]["email"]).to eq(user.email)
      end
    end

    context "無効な認証情報の場合" do
      it "パスワードが間違っている場合、401エラーを返す" do
        post "/api/v1/auth/sign_in", params: { email: user.email, password: "WrongPassword" }, as: :json

        expect(response).to have_http_status(:unauthorized)
        json = response.parsed_body
        expect(json["status"]).to eq("error")
        expect(json["errors"]).to be_present
      end

      it "メールアドレスが存在しない場合、401エラーを返す" do
        post "/api/v1/auth/sign_in", params: { email: "nonexistent@example.com", password: "Password123" }, as: :json

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
