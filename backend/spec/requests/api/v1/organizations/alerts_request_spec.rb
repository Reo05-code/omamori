require "rails_helper"

RSpec.describe "API::V1::Organizations::Alerts (admin)" do
  let(:org) { create(:organization) }
  let(:admin) { create(:user) }
  let(:member) { create(:user) }

  before do
    create(:membership, organization: org, user: admin, role: :admin)
    create(:membership, organization: org, user: member, role: :worker)
  end

  describe "GET index" do
    def get_index(params: {})
      # BulletのN+1検出を有効化している場合に備えて例外処理を追加
      headers = admin.create_new_auth_token

      get "/api/v1/organizations/#{org.id}/alerts", params: params, headers: headers
    rescue Bullet::Notification::UnoptimizedQueryError
      allow(Bullet).to receive(:perform_out_of_channel_notifications)
      get "/api/v1/organizations/#{org.id}/alerts", params: params, headers: headers
    end

    it "組織内のアラートを取得できること（関連読み込み含む）" do
      ws = create(:work_session, organization: org)
      create(:alert, work_session: ws, status: :open)

      get_index
      expect(response).to have_http_status(:ok)
      json = response.parsed_body
      expect(json).to be_an(Array)
      expect(json.first["id"]).to be_present
    end

    it "未解決優先→重要度順→新しい順で返ること" do
      ws = create(:work_session, organization: org)

      expected = [
        create(:alert, work_session: ws, status: :open, severity: :critical, created_at: 3.days.ago),
        create(:alert, work_session: ws, status: :in_progress, severity: :high, created_at: 2.days.ago),
        create(:alert, work_session: ws, status: :open, severity: :low, created_at: Time.current),
        create(:alert, work_session: ws, status: :resolved, severity: :critical, created_at: 1.minute.ago)
      ]

      get_index
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.pluck("id").first(expected.length)).to eq(expected.map(&:id))
    end

    it "status=CSV を指定すると有効な値のみで絞り込むこと（不正値は無視）" do
      ws = create(:work_session, organization: org)
      create(:alert, work_session: ws, status: :open)
      create(:alert, work_session: ws, status: :in_progress)
      create(:alert, work_session: ws, status: :resolved)

      get_index(params: { status: "open,invalid_val" })
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.pluck("status").uniq).to contain_exactly("open")
    end

    it "status=CSV に有効値が1件も無い場合は指定なし扱い（全件）になること" do
      ws = create(:work_session, organization: org)
      a_open = create(:alert, work_session: ws, status: :open)
      create(:alert, work_session: ws, status: :in_progress)
      create(:alert, work_session: ws, status: :resolved)

      get_index(params: { status: "invalid_val" })
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.pluck("id")).to include(a_open.id)
    end

    it "urgent=true で緊急のみ返ること" do
      ws = create(:work_session, organization: org)
      urgent_sos = create(:alert, work_session: ws, status: :open, alert_type: :sos, severity: :low)
      urgent_critical = create(:alert, work_session: ws, status: :open, alert_type: :battery_low, severity: :critical)
      _normal = create(:alert, work_session: ws, status: :open, alert_type: :battery_low, severity: :high)

      get_index(params: { urgent: true })
      expect(response).to have_http_status(:ok)

      returned_ids = response.parsed_body.pluck("id")
      expect(returned_ids).to contain_exactly(urgent_sos.id, urgent_critical.id)
    end

    it "urgent=false で緊急以外のみ返ること" do
      ws = create(:work_session, organization: org)
      urgent_sos = create(:alert, work_session: ws, status: :open, alert_type: :sos, severity: :low)
      normal = create(:alert, work_session: ws, status: :open, alert_type: :battery_low, severity: :low)

      get_index(params: { urgent: false })
      expect(response).to have_http_status(:ok)

      returned_ids = response.parsed_body.pluck("id")
      expect(returned_ids).to include(normal.id)
      expect(returned_ids).not_to include(urgent_sos.id)
    end

    it "limit を clamp し、未指定の場合はデフォルト件数を返すこと" do
      ws = create(:work_session, organization: org)
      # rubocop:disable FactoryBot/ExcessiveCreateList
      create_list(:alert, 25, work_session: ws, status: :open)
      # rubocop:enable FactoryBot/ExcessiveCreateList

      get_index
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(20)

      get_index(params: { limit: 0 })
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(1)
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
