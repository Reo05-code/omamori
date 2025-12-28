# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::RiskAssessments" do
  # 共通のデータセットアップ
  let(:organization) { create(:organization) }
  let(:member) { create(:user) }
  let(:work_session) { create(:work_session, user: create(:user), organization: organization) }

  before do
    create(:membership, user: member, organization: organization)
  end

  describe "GET /api/v1/work_sessions/:work_session_id/risk_assessments" do
    let(:path) { api_v1_work_session_risk_assessments_path(work_session) }

    context "正常系: 組織のメンバーがアクセスした場合" do
      let!(:assessments) do
        old_log = create(:safety_log, work_session: work_session, logged_at: 2.hours.ago)
        new_log = create(:safety_log, work_session: work_session, logged_at: 1.hour.ago)
        [
          create(:risk_assessment, safety_log: old_log, score: 10),
          create(:risk_assessment, safety_log: new_log, score: 80)
        ]
      end

      before do
        get api_v1_work_session_risk_assessments_path(work_session),
            headers: member.create_new_auth_token,
            as: :json
      end

      it "200 OK を返す" do
        expect(response).to have_http_status(:ok)
      end

      it "アセスメントの一覧が配列で返る" do
        body = response.parsed_body
        expect(body).to be_an(Array)
        expect(body.length).to eq(2)
      end

      it "古い順（ASC）にソートされている" do
        body = response.parsed_body
        expect(body[0]["id"]).to eq(assessments[0].id)
        expect(body[1]["id"]).to eq(assessments[1].id)
      end

      it "ページネーション用ヘッダーが含まれている" do
        expect(response.headers["X-Total-Count"]).to eq("2")
        expect(response.headers["X-Current-Page"]).to eq("1")
      end
    end

    context "異常系: 組織外のユーザーがアクセスした場合" do
      before do
        # Stranger(部外者)をその場で作成してトークン生成
        stranger_headers = create(:user).create_new_auth_token

        get api_v1_work_session_risk_assessments_path(work_session),
            headers: stranger_headers,
            as: :json
      end

      it "404 Not Found を返す（存在を隠蔽するため）" do
        # コントローラの find_user_work_session! は検索できない場合 404 を返す実装のため
        expect(response).to have_http_status(:not_found)
      end
    end

    context "異常系: 未認証ユーザーの場合" do
      it "401 Unauthorized を返す" do
        get api_v1_work_session_risk_assessments_path(work_session), as: :json
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end
