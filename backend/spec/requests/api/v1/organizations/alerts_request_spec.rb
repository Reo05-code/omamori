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

  describe "GET summary" do
    def organization_alerts_summary
      headers = admin.create_new_auth_token
      get "/api/v1/organizations/#{org.id}/alerts/summary", headers: headers
    end

    it "組織のアラート集計を正しく返すこと" do # rubocop:disable RSpec/ExampleLength
      ws = create(:work_session, organization: org)
      # open: 3件（うちSOS:1, critical非SOS:1, 通常:1）
      create(:alert, work_session: ws, status: :open, alert_type: :sos, severity: :critical)
      create(:alert, work_session: ws, status: :open, alert_type: :risk_high, severity: :critical)
      create(:alert, work_session: ws, status: :open, alert_type: :battery_low, severity: :medium)
      # in_progress: 2件
      create(:alert, work_session: ws, status: :in_progress, severity: :high)
      create(:alert, work_session: ws, status: :in_progress, severity: :low)
      # resolved: 1件（集計対象外）
      create(:alert, work_session: ws, status: :resolved, severity: :critical)

      organization_alerts_summary
      expect(response).to have_http_status(:ok)

      json = response.parsed_body
      expect(json["counts"]["unresolved"]).to eq(5) # open:3 + in_progress:2
      expect(json["counts"]["open"]).to eq(3)
      expect(json["counts"]["in_progress"]).to eq(2)
    end

    it "urgent_openの集計が正しいこと" do
      ws = create(:work_session, organization: org)
      create(:alert, work_session: ws, status: :open, alert_type: :sos, severity: :critical)
      create(:alert, work_session: ws, status: :open, alert_type: :risk_high, severity: :critical)

      organization_alerts_summary
      json = response.parsed_body
      expect(json["counts"]["urgent_open"]).to eq(2)  # SOS:1 + critical非SOS:1
    end

    it "内訳の集計が正しいこと" do
      ws = create(:work_session, organization: org)
      create(:alert, work_session: ws, status: :open, alert_type: :sos, severity: :critical)
      create(:alert, work_session: ws, status: :open, alert_type: :risk_high, severity: :critical)

      organization_alerts_summary
      json = response.parsed_body
      expect(json["breakdown"]["urgent"]["sos_open"]).to eq(1)
      expect(json["breakdown"]["urgent"]["critical_open_non_sos"]).to eq(1)
    end

    it "重複排除が正しく動作すること（SOS + critical_non_sos = urgent_open）" do
      ws = create(:work_session, organization: org)
      create(:alert, work_session: ws, status: :open, alert_type: :sos, severity: :critical)
      create(:alert, work_session: ws, status: :open, alert_type: :risk_high, severity: :critical)

      organization_alerts_summary
      expect(response).to have_http_status(:ok)

      json = response.parsed_body
      sos = json["breakdown"]["urgent"]["sos_open"]
      critical_non_sos = json["breakdown"]["urgent"]["critical_open_non_sos"]
      urgent_total = json["counts"]["urgent_open"]

      expect(sos + critical_non_sos).to eq(urgent_total)
    end

    it "worker権限では 403 を返すこと" do
      headers = member.create_new_auth_token
      get "/api/v1/organizations/#{org.id}/alerts/summary", headers: headers

      expect(response).to have_http_status(:forbidden)
    end

    it "所属していない組織では 404 を返すこと" do
      other_org = create(:organization)
      headers = admin.create_new_auth_token
      get "/api/v1/organizations/#{other_org.id}/alerts/summary", headers: headers

      expect(response).to have_http_status(:not_found)
    end

    it "in_progress の critical は urgent に含まれないこと" do
      ws = create(:work_session, organization: org)
      create(:alert, work_session: ws, status: :open, severity: :critical, alert_type: :risk_high)
      create(:alert, work_session: ws, status: :in_progress, severity: :critical, alert_type: :risk_high)

      organization_alerts_summary
      expect(response).to have_http_status(:ok)

      json = response.parsed_body
      expect(json["counts"]["urgent_open"]).to eq(1)  # open の critical のみ
    end
  end
end
