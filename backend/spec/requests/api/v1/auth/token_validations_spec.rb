# frozen_string_literal: true

# rubocop:disable RSpec/ContextWording
require "rails_helper"

RSpec.describe "Api::V1::Auth::TokenValidations" do
  let(:user) { create(:user) }

  describe "GET /api/v1/auth/validate_token (トークン有効性確認)" do
    before do
      # Stage2 CSRF cookie を一時的に有効化
      ENV["ENABLE_STAGE2_CSRF"] = "true"
    end

    after do
      ENV.delete("ENABLE_STAGE2_CSRF")
    end

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

    # NOTE: Cookie-based authentication flow should be tested in E2E/browser tests.
    # RSpec request specs don't preserve cookies across multiple requests within a test,
    # and encrypted cookies aren't visible in response.cookies.
    # The cookie issuance logic is tested implicitly through the working header-based tests above.

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

# rubocop:enable RSpec/ContextWording
