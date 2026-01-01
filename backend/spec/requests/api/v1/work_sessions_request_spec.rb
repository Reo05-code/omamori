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

    context "Admin による代理作成" do
      let(:admin_user) { create(:user) }
      let(:worker_user) { create(:user) }
      let(:organization) { create(:organization) }

      before do
        create(:membership, organization: organization, user: admin_user, role: :admin)
        create(:membership, organization: organization, user: worker_user, role: :worker)
      end

      it "Admin が同じ組織の Worker のセッションを作成できる" do
        post "/api/v1/work_sessions",
             params: { work_session: { organization_id: organization.id, user_id: worker_user.id } },
             headers: admin_user.create_new_auth_token,
             as: :json

        expect(response).to have_http_status(:created)
        json = response.parsed_body
        expect(json["user_id"]).to eq(worker_user.id)
        expect(json["organization_id"]).to eq(organization.id)
      end

      it "作成時の created_by_user_id は admin_user になる" do
        post "/api/v1/work_sessions",
             params: { work_session: { organization_id: organization.id, user_id: worker_user.id } },
             headers: admin_user.create_new_auth_token,
             as: :json

        expect(response).to have_http_status(:created)
        json = response.parsed_body
        expect(json["created_by_user_id"]).to eq(admin_user.id)

        ws = WorkSession.find(json["id"])
        expect(ws.created_by_user_id).to eq(admin_user.id)
      end

      it "Admin が他の組織の Worker のセッションを作成できない (404)" do
        other_org = create(:organization)
        other_worker = create(:user)
        create(:membership, organization: other_org, user: other_worker, role: :worker)

        post "/api/v1/work_sessions",
             params: { work_session: { organization_id: organization.id, user_id: other_worker.id } },
             headers: admin_user.create_new_auth_token,
             as: :json

        expect(response).to have_http_status(:not_found)
      end

      it "Worker が他の Worker のセッションを作成しようとすると 403" do
        another_worker = create(:user)
        create(:membership, organization: organization, user: another_worker, role: :worker)

        post "/api/v1/work_sessions",
             params: { work_session: { organization_id: organization.id, user_id: another_worker.id } },
             headers: worker_user.create_new_auth_token,
             as: :json

        expect(response).to have_http_status(:forbidden)
      end
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

    context "Admin による代理終了" do
      let(:admin_user) { create(:user) }
      let(:worker_user) { create(:user) }

      before do
        create(:membership, organization: organization, user: admin_user, role: :admin)
        create(:membership, organization: organization, user: worker_user, role: :worker)
      end

      it "Admin が同じ組織の Worker のセッションを終了できる" do
        ws = create(:work_session, user: worker_user, organization: organization)

        post "/api/v1/work_sessions/#{ws.id}/finish", headers: admin_user.create_new_auth_token, as: :json

        expect(response).to have_http_status(:ok)
        json = response.parsed_body
        expect(json["status"]).to eq("completed")
        expect(json["ended_at"]).to be_present
      end
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

    context "Admin による代理キャンセル" do
      let(:admin_user) { create(:user) }
      let(:worker_user) { create(:user) }

      before do
        create(:membership, organization: organization, user: admin_user, role: :admin)
        create(:membership, organization: organization, user: worker_user, role: :worker)
      end

      it "Admin が同じ組織の Worker のセッションをキャンセルできる" do
        ws = create(:work_session, user: worker_user, organization: organization)

        post "/api/v1/work_sessions/#{ws.id}/cancel", headers: admin_user.create_new_auth_token, as: :json

        expect(response).to have_http_status(:ok)
        json = response.parsed_body
        expect(json["status"]).to eq("cancelled")
        expect(json["ended_at"]).to be_present
      end
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

    it "他ユーザーのセッションは 404" do
      other = create(:user)
      create(:membership, organization: organization, user: other)
      ws = create(:work_session, user: other, organization: organization)

      get "/api/v1/work_sessions/#{ws.id}", headers: user.create_new_auth_token, as: :json

      expect(response).to have_http_status(:not_found)
    end

    context "Admin による閲覧" do
      let(:admin_user) { create(:user) }
      let(:worker_user) { create(:user) }

      before do
        create(:membership, organization: organization, user: admin_user, role: :admin)
        create(:membership, organization: organization, user: worker_user, role: :worker)
      end

      it "Admin が同じ組織の Worker のセッション詳細を閲覧できる" do
        ws = create(:work_session, user: worker_user, organization: organization)

        get "/api/v1/work_sessions/#{ws.id}", headers: admin_user.create_new_auth_token, as: :json

        expect(response).to have_http_status(:ok)
        json = response.parsed_body
        expect(json["id"]).to eq(ws.id)
      end
    end
  end
end
