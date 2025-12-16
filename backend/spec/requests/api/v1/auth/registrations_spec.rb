# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Auth::Registrations" do
  let(:valid_attributes) do
    {
      email: "newuser@example.com",
      password: "password123",
      password_confirmation: "password123",
      name: "New User",
      phone_number: "09012345678"
    }
  end

  let(:invalid_attributes) do
    {
      email: "",
      password: "short",
      password_confirmation: "mismatch",
      name: "",
      phone_number: ""
    }
  end

  describe "POST /api/v1/auth (ユーザー登録)" do
    context "有効なパラメータの場合" do
      it "新しいユーザーを作成する" do
        expect do
          post "/api/v1/auth", params: valid_attributes, as: :json
        end.to change(User, :count).by(1)
      end

      it "成功レスポンスを返す" do
        post "/api/v1/auth", params: valid_attributes, as: :json

        expect(response).to have_http_status(:ok)
        json = response.parsed_body
        expect(json["status"]).to eq("success")
        expect(json["data"]).to be_present
      end

      it "認証情報を返す（ヘッダーは公開せずクッキーに設定する）" do
        post "/api/v1/auth", params: valid_attributes, as: :json

        # ヘッダーはクッキーへ移し、レスポンスヘッダーを露出しない設計のため
        # ここでは httpOnly クッキーが設定されていることのみ検証する
        expect(response.cookies["access_token"]).to be_present
        expect(response.cookies["client"]).to be_present
        expect(response.cookies["uid"]).to be_present
      end
    end

    context "無効なパラメータの場合" do
      it "ユーザーを作成しない" do
        expect do
          post "/api/v1/auth", params: invalid_attributes, as: :json
        end.not_to change(User, :count)
      end

      it "エラーレスポンスを返す" do
        post "/api/v1/auth", params: invalid_attributes, as: :json

        expect(response).to have_http_status(:unprocessable_entity)
        json = response.parsed_body
        expect(json["status"]).to eq("error")
        expect(json["errors"]).to be_present
      end
    end

    context "既存のメールアドレスの場合" do
      before { create(:user, email: "existing@example.com") }

      it "エラーを返す" do
        post "/api/v1/auth", params: valid_attributes.merge(email: "existing@example.com"), as: :json

        expect(response).to have_http_status(:unprocessable_entity)
        json = response.parsed_body
        expect(json["status"]).to eq("error")
      end
    end
  end

  describe "PUT /api/v1/auth (ユーザー情報更新)" do
    let(:user) { create(:user) }
    let(:auth_headers) { user.create_new_auth_token }

    context "認証済みの場合" do
      it "ユーザー情報を更新できる" do
        put "/api/v1/auth", params: { name: "Updated Name" }, headers: auth_headers, as: :json

        expect(response).to have_http_status(:ok)
        json = response.parsed_body
        expect(json["status"]).to eq("success")
        expect(user.reload.name).to eq("Updated Name")
      end
    end

    context "未認証の場合" do
      it "401エラーを返す" do
        put "/api/v1/auth", params: { name: "Updated Name" }, as: :json

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe "DELETE /api/v1/auth (アカウント削除)" do
    let!(:user) { create(:user) }
    let(:auth_headers) { user.create_new_auth_token }

    context "認証済みの場合" do
      it "アカウントを削除する" do
        expect do
          delete "/api/v1/auth", headers: auth_headers, as: :json
        end.to change(User, :count).by(-1)
      end

      it "成功レスポンスを返す" do
        delete "/api/v1/auth", headers: auth_headers, as: :json

        expect(response).to have_http_status(:ok)
        json = response.parsed_body
        expect(json["status"]).to eq("success")
      end
    end

    context "未認証の場合" do
      it "401エラーを返す" do
        delete "/api/v1/auth", as: :json

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end

# rubocop:enable RSpec/ContextWording
