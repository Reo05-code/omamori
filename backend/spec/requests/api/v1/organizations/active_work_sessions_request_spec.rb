# frozen_string_literal: true

require "rails_helper"

RSpec.describe "API::V1::Organizations::ActiveWorkSessions" do
  let(:org) { create(:organization) }
  let(:admin) { create(:user) }
  let(:worker) { create(:user) }

  before do
    create(:membership, organization: org, user: admin, role: :admin)
    create(:membership, organization: org, user: worker, role: :worker)
  end

  describe "GET /api/v1/organizations/:organization_id/active_work_sessions/latest_locations" do
    def get_latest_locations(user:)
      headers = user.create_new_auth_token
      get "/api/v1/organizations/#{org.id}/active_work_sessions/latest_locations", headers: headers
    end

    context "管理者としてアクセスした場合" do
      it "アクティブな作業セッションの最新位置情報を取得できること" do
        ws = create(:work_session, organization: org, user: worker, status: :in_progress)
        create(:safety_log, work_session: ws, logged_at: 1.hour.ago, latitude: 35.0, longitude: 139.0)
        latest = create(:safety_log, work_session: ws, logged_at: Time.current, latitude: 35.6762, longitude: 139.6503)

        get_latest_locations(user: admin)

        expect(response).to have_http_status(:ok)
        json = response.parsed_body
        expect(json.first).to include("work_session_id" => ws.id, "user_id" => worker.id, "latitude" => latest.latitude)
      end

      it "複数のアクティブセッションがある場合、それぞれの最新位置を返すこと" do
        worker2 = create(:user)
        create(:membership, organization: org, user: worker2, role: :worker)
        ws1 = create(:work_session, organization: org, user: worker, status: :in_progress)
        ws2 = create(:work_session, organization: org, user: worker2, status: :in_progress)
        create(:safety_log, work_session: ws1, logged_at: Time.current, latitude: 35.0, longitude: 139.0)
        create(:safety_log, work_session: ws2, logged_at: Time.current, latitude: 36.0, longitude: 140.0)

        get_latest_locations(user: admin)

        expect(response).to have_http_status(:ok)
        expect(response.parsed_body.length).to eq(2)
        expect(response.parsed_body.pluck("work_session_id")).to contain_exactly(ws1.id, ws2.id)
      end

      it "完了済みセッションは含まれないこと" do
        completed_ws = create(:work_session, organization: org, user: worker, status: :completed)
        create(:safety_log, work_session: completed_ws, logged_at: Time.current)

        get_latest_locations(user: admin)

        expect(response).to have_http_status(:ok)
        expect(response.parsed_body).to eq([])
      end

      it "SafetyLog がない場合は空配列を返すこと" do
        create(:work_session, organization: org, user: worker, status: :in_progress)

        get_latest_locations(user: admin)

        expect(response).to have_http_status(:ok)
        expect(response.parsed_body).to eq([])
      end

      it "他の組織のセッションは含まれないこと" do
        other_org = create(:organization)
        other_user = create(:user)
        create(:membership, organization: other_org, user: other_user, role: :worker)
        other_ws = create(:work_session, organization: other_org, user: other_user, status: :in_progress)
        create(:safety_log, work_session: other_ws, logged_at: Time.current)

        get_latest_locations(user: admin)

        expect(response).to have_http_status(:ok)
        expect(response.parsed_body).to eq([])
      end
    end

    context "非管理者としてアクセスした場合" do
      it "403 Forbidden を返すこと" do
        get_latest_locations(user: worker)

        expect(response).to have_http_status(:forbidden)
      end
    end

    context "未認証の場合" do
      it "401 Unauthorized を返すこと" do
        get "/api/v1/organizations/#{org.id}/active_work_sessions/latest_locations"

        expect(response).to have_http_status(:unauthorized)
      end
    end

    context "存在しない組織にアクセスした場合" do
      it "404 Not Found を返すこと" do
        headers = admin.create_new_auth_token
        get "/api/v1/organizations/999999/active_work_sessions/latest_locations", headers: headers

        expect(response).to have_http_status(:not_found)
      end
    end
  end
end
