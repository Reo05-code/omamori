# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Auth::TokenValidations", type: :request do
  let(:user) { create(:user) }

  describe "GET /api/v1/auth/validate_token (トークン有効性確認)" do
    context "有効なトークンの場合" do
      let(:auth_headers) { user.create_new_auth_token }

      it "成功レスポンスを返す" do
        get "/api/v1/auth/validate_token", headers: auth_headers, as: :json

        expect(response).to have_http_status(:ok)
        json = response.parsed_body
        expect(json["status"]).to eq("success")
      end

      it "ユーザー情報を返す" do
        get "/api/v1/auth/validate_token", headers: auth_headers, as: :json

        json = response.parsed_body
        expect(json["data"]).to be_present
        expect(json["data"]["email"]).to eq(user.email)
      end
    end

    context "無効なトークンの場合" do
      it "401エラーを返す" do
        get "/api/v1/auth/validate_token", headers: {
          "access-token" => "invalid-token",
          "client" => "invalid-client",
          "uid" => user.email
        }, as: :json

        expect(response).to have_http_status(:unauthorized)
        json = response.parsed_body
        expect(json["status"]).to eq("error")
      end
    end

    context "トークンがない場合" do
      it "401エラーを返す" do
        get "/api/v1/auth/validate_token", as: :json

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end
