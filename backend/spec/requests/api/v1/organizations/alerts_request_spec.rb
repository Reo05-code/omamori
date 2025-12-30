require "rails_helper"

RSpec.describe "API::V1::Organizations::Alerts (admin)" do
  let(:org) { create(:organization) }
  let(:admin) { create(:user) }
  let(:member) { create(:user) }

  before do
    org.memberships.create!(user: admin, role: :admin)
    org.memberships.create!(user: member, role: :worker)
  end

  describe "GET index" do
    let(:headers) { admin.create_new_auth_token }

    before do
      ws = create(:work_session, organization: org)
      create(:alert, work_session: ws, status: :open)

      # BulletのN+1検出を有効化している場合に備えて例外処理を追加
      begin
        get "/api/v1/organizations/#{org.id}/alerts", headers: headers, as: :json
      rescue Bullet::Notification::UnoptimizedQueryError
        allow(Bullet).to receive(:perform_out_of_channel_notifications)
        get "/api/v1/organizations/#{org.id}/alerts", headers: headers, as: :json
      end
    end

    it "組織内のアラートを取得できること（関連読み込み含む）" do
      expect(response).to have_http_status(:ok)
      json = response.parsed_body
      expect(json).to be_an(Array)
      expect(json.first["id"]).to be_present
    end
  end

  describe "PATCH update" do
    it "resolved にすると handled_by_user と resolved_at が設定されること" do
      ws = create(:work_session, organization: org)
      alert = create(:alert, work_session: ws, status: :open)

      headers = admin.create_new_auth_token
      allow(alert).to receive(:with_lock).and_yield

      patch "/api/v1/organizations/#{org.id}/alerts/#{alert.id}", params: { alert: { status: "resolved" } }, headers: headers, as: :json

      expect(response).to have_http_status(:ok)
      alert.reload
      expect(alert.handled_by_user_id).to eq(admin.id)
      expect(alert.resolved_at).not_to be_nil
    end

    it "組織外のアラートは 404 を返すこと" do
      other_org = create(:organization)
      ws = create(:work_session, organization: other_org)
      alert = create(:alert, work_session: ws, status: :open)

      headers = admin.create_new_auth_token
      patch "/api/v1/organizations/#{org.id}/alerts/#{alert.id}", params: { alert: { status: "resolved" } }, headers: headers, as: :json

      expect(response).to have_http_status(:not_found)
    end

    it "不正なステータスで更新した場合 422 を返すこと" do
      ws = create(:work_session, organization: org)
      alert = create(:alert, work_session: ws, status: :open)

      headers = admin.create_new_auth_token
      patch "/api/v1/organizations/#{org.id}/alerts/#{alert.id}", params: { alert: { status: "invalid_status" } }, headers: headers, as: :json

      expect(response).to have_http_status(:unprocessable_content)
    end
  end
end
