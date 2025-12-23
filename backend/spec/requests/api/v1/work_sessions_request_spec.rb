# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::WorkSessions" do
  include ActiveSupport::Testing::TimeHelpers

  def fetch_work_session_json(work_session, auth_headers)
    freeze_time do
      get "/api/v1/work_sessions/#{work_session.id}", headers: auth_headers, as: :json
    end
    response.parsed_body
  end

  describe "POST /api/v1/work_sessions (開始)" do
    let(:user) { create(:user) }
    let(:organization) { create(:organization) }

    before do
      create(:membership, organization: organization, user: user)
    end

    it "作業セッションを作成する" do
      post "/api/v1/work_sessions",
           params: { work_session: { organization_id: organization.id } },
           headers: user.create_new_auth_token,
           as: :json

      expect(response).to have_http_status(:created)
      json = response.parsed_body
      expect(json["id"]).to be_present
      expect(json["status"]).to eq("in_progress")
      expect(json["organization_id"]).to eq(organization.id)
    end

    it "既に進行中のセッションがある場合は 422" do
      create(:work_session, user: user, organization: organization, status: :in_progress, ended_at: nil)

      post "/api/v1/work_sessions",
           params: { work_session: { organization_id: organization.id } },
           headers: user.create_new_auth_token,
           as: :json

      expect(response).to have_http_status(:unprocessable_entity)
      json = response.parsed_body
      expect(json["errors"]).to be_present
    end

    it "所属していない組織IDの場合は 404" do
      other_org = create(:organization)

      post "/api/v1/work_sessions",
           params: { work_session: { organization_id: other_org.id } },
           headers: user.create_new_auth_token,
           as: :json

      expect(response).to have_http_status(:not_found)
    end
  end

  describe "GET /api/v1/work_sessions/current (進行中取得)" do
    let(:user) { create(:user) }
    let(:organization) { create(:organization) }

    before do
      create(:membership, organization: organization, user: user)
    end

    it "進行中がない場合は null を返す" do
      get "/api/v1/work_sessions/current", headers: user.create_new_auth_token, as: :json

      expect(response).to have_http_status(:ok)
      json = response.parsed_body
      expect(json["work_session"]).to be_nil
    end

    it "進行中がある場合はそのセッションを返す" do
      ws = create(:work_session, user: user, organization: organization)

      get "/api/v1/work_sessions/current", headers: user.create_new_auth_token, as: :json

      expect(response).to have_http_status(:ok)
      json = response.parsed_body
      expect(json["work_session"]["id"]).to eq(ws.id)
    end
  end

  describe "POST /api/v1/work_sessions/:id/finish (終了)" do
    let(:user) { create(:user) }
    let(:organization) { create(:organization) }

    before do
      create(:membership, organization: organization, user: user)
    end

    it "セッションを completed に更新する" do
      ws = create(:work_session, user: user, organization: organization)

      post "/api/v1/work_sessions/#{ws.id}/finish", headers: user.create_new_auth_token, as: :json

      expect(response).to have_http_status(:ok)
      json = response.parsed_body
      expect(json["status"]).to eq("completed")
      expect(json["ended_at"]).to be_present
    end

    it "他ユーザーのセッションは 404" do
      other = create(:user)
      create(:membership, organization: organization, user: other)
      ws = create(:work_session, user: other, organization: organization)

      post "/api/v1/work_sessions/#{ws.id}/finish", headers: user.create_new_auth_token, as: :json

      expect(response).to have_http_status(:not_found)
    end
  end

  describe "POST /api/v1/work_sessions/:id/cancel (キャンセル)" do
    let(:user) { create(:user) }
    let(:organization) { create(:organization) }

    before do
      create(:membership, organization: organization, user: user)
    end

    it "セッションを cancelled に更新する" do
      ws = create(:work_session, user: user, organization: organization)

      post "/api/v1/work_sessions/#{ws.id}/cancel", headers: user.create_new_auth_token, as: :json

      expect(response).to have_http_status(:ok)
      json = response.parsed_body
      expect(json["status"]).to eq("cancelled")
      expect(json["ended_at"]).to be_present
    end
  end

  describe "GET /api/v1/work_sessions/:id (詳細)" do
    let(:user) { create(:user) }
    let(:organization) { create(:organization) }

    before do
      create(:membership, organization: organization, user: user)
    end

    it "セッション詳細（監視ジョブ情報含む）を返す" do
      ws = create(:work_session, user: user, organization: organization)
      ws.update!(active_monitoring_jid: "jid123", scheduled_at: 1.hour.from_now)

      json = fetch_work_session_json(ws, user.create_new_auth_token)

      expect(response).to have_http_status(:ok)
      expect(json["id"]).to eq(ws.id)
      expect(json["monitoring_job"]).to be_present
      expect(json["monitoring_job"]["status"]).to eq("scheduled")
      expect(json["monitoring_job"]["scheduled_at"]).to be_present
    end
  end
end
