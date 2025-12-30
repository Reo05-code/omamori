require "rails_helper"

RSpec.describe "API::V1::Alerts (worker)" do
  let(:user) { create(:user) }
  let(:other) { create(:user) }
  let(:ws) { create(:work_session, user: user) }

  describe "POST /api/v1/work_sessions/:work_session_id/alerts" do
    let(:path) { "/api/v1/work_sessions/#{ws.id}/alerts" }

    it "トークンなしで認証エラーになること" do
      post path, as: :json
      expect(response.status).to be_in([401, 403])
    end

    it "lat/lon を渡すとアラートと SafetyLog が作成されること" do
      headers = user.create_new_auth_token
      expect { post path, params: { latitude: 35.0, longitude: 139.0 }, headers: headers, as: :json }.to change(Alert, :count).by(1).and change(SafetyLog, :count).by(1)
      expect(response).to have_http_status(:created)
    end

    # 201 (Created) ではなく 200 (OK) を返すことを確認
    it "直近5分内の重複がある場合、既存のアラートを返し200を返すこと" do
      create(:alert, work_session: ws, alert_type: :sos, status: :open, created_at: 1.minute.ago)
      headers = user.create_new_auth_token
      post path, params: { latitude: 35.0, longitude: 139.0 }, headers: headers, as: :json
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["message"]).to match(/Duplicate/)
    end

    it "他ユーザーの work_session_id を指定すると 404 を返すこと" do
      other_ws = create(:work_session, user: other)
      headers = user.create_new_auth_token
      post "/api/v1/work_sessions/#{other_ws.id}/alerts", params: { latitude: 35.0, longitude: 139.0 }, headers: headers, as: :json
      expect(response).to have_http_status(:not_found)
    end

    # 命に関わる機能なので、位置情報が無くてもSOSアラートだけは通す
    it "lat/lon なしかつ safety_log_id なしでも作成できること" do
      headers = user.create_new_auth_token
      expect { post path, params: {}, headers: headers, as: :json }.to change(Alert, :count).by(1)
      expect(response).to have_http_status(:created)
      body = response.parsed_body
      expect(body["safety_log_id"]).to be_nil
    end
  end
end
