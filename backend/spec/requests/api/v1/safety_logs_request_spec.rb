# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::SafetyLogs" do
  include ActiveSupport::Testing::TimeHelpers

  let(:user) { create(:user) }
  let(:organization) { create(:organization) }
  let(:work_session) { create(:work_session, user: user, organization: organization) }

  before do
    create(:membership, organization: organization, user: user, role: :worker)
  end

  describe "POST /api/v1/work_sessions/:work_session_id/safety_logs (ログ送信)" do
    let(:valid_params) do
      {
        safety_log: {
          latitude: 35.6812362,
          longitude: 139.7671248,
          battery_level: 80,
          trigger_type: "heartbeat",
          gps_accuracy: 12.5,
          is_offline_sync: false
        }
      }
    end

    before do
      allow(WeatherService).to receive(:fetch_weather).and_return({ temp: 25.0, condition: :clear })
    end

    context "WorkSession の所有者の場合" do
      it "ログを保存して成功レスポンスを返す" do
        post "/api/v1/work_sessions/#{work_session.id}/safety_logs",
             params: valid_params,
             headers: user.create_new_auth_token,
             as: :json

        expect(response).to have_http_status(:created)
        json = response.parsed_body
        expect(json["status"]).to eq("success")
        expect(json["safety_log"]["latitude"]).to eq(35.6812362)
      end

      it "天気情報を含めてログを保存する" do
        post "/api/v1/work_sessions/#{work_session.id}/safety_logs",
             params: valid_params,
             headers: user.create_new_auth_token,
             as: :json

        json = response.parsed_body
        expect(json["safety_log"]["weather_temp"]).to eq(25.0)
        expect(json["safety_log"]["weather_condition"]).to eq("晴れ")
      end

      it "リスク判定結果を返す" do
        post "/api/v1/work_sessions/#{work_session.id}/safety_logs",
             params: valid_params,
             headers: user.create_new_auth_token,
             as: :json

        json = response.parsed_body
        expect(json["risk_level"]).to be_present
      end

      it "RiskAssessmentService を呼び出す" do
        service_instance = instance_double(RiskAssessmentService)
        allow(RiskAssessmentService).to receive(:new).and_return(service_instance)
        allow(service_instance).to receive(:call).and_return({ risk_level: "safe", risk_reasons: [], next_poll_interval: 60 })

        post "/api/v1/work_sessions/#{work_session.id}/safety_logs",
             params: valid_params,
             headers: user.create_new_auth_token,
             as: :json

        expect(RiskAssessmentService).to have_received(:new)
      end

      it "logged_at を ISO8601 形式で受け取る" do
        params_with_time = valid_params.deep_merge(
          safety_log: { logged_at: "2025-12-26T10:30:00Z" }
        )

        post "/api/v1/work_sessions/#{work_session.id}/safety_logs",
             params: params_with_time,
             headers: user.create_new_auth_token,
             as: :json

        expect(response).to have_http_status(:created)
        json = response.parsed_body
        expect(json["safety_log"]["logged_at"]).to be_present
      end

      it "天気取得に失敗した場合もログを保存する" do
        allow(WeatherService).to receive(:fetch_weather).and_return(nil)

        post "/api/v1/work_sessions/#{work_session.id}/safety_logs",
             params: valid_params,
             headers: user.create_new_auth_token,
             as: :json

        expect(response).to have_http_status(:created)
        json = response.parsed_body
        expect(json["safety_log"]).not_to have_key("weather_temp")
        expect(json["safety_log"]).not_to have_key("weather_condition")
      end
    end

    context "バリデーションエラーの場合" do
      it "latitude/longitude が欠けている場合は 422" do
        invalid_params = { safety_log: { battery_level: 80, trigger_type: "heartbeat" } }

        post "/api/v1/work_sessions/#{work_session.id}/safety_logs",
             params: invalid_params,
             headers: user.create_new_auth_token,
             as: :json

        expect(response).to have_http_status(:unprocessable_content)
        expect(response.parsed_body["errors"]).to be_present
      end

      it "battery_level が範囲外の場合は 422" do
        invalid_params = valid_params.deep_merge(
          safety_log: { battery_level: 150 }
        )

        post "/api/v1/work_sessions/#{work_session.id}/safety_logs",
             params: invalid_params,
             headers: user.create_new_auth_token,
             as: :json

        expect(response).to have_http_status(:unprocessable_content)
      end
    end

    context "認可エラーの場合" do
      it "他人の WorkSession には送信できず 403" do
        other_user = create(:user)
        create(:membership, organization: organization, user: other_user, role: :worker)

        post "/api/v1/work_sessions/#{work_session.id}/safety_logs",
             params: valid_params,
             headers: other_user.create_new_auth_token,
             as: :json

        expect(response).to have_http_status(:forbidden)
        json = response.parsed_body
        expect(json["errors"]).to include("作業セッションの所有者のみログを送信できます")
      end
    end

    context "WorkSession が存在しない場合" do
      it "404 を返す" do
        post "/api/v1/work_sessions/99999/safety_logs",
             params: valid_params,
             headers: user.create_new_auth_token,
             as: :json

        expect(response).to have_http_status(:not_found)
      end
    end
  end

  describe "GET /api/v1/work_sessions/:work_session_id/safety_logs (履歴取得)" do
    before do
      create(:safety_log, work_session: work_session, logged_at: 1.hour.ago, latitude: 35.0, longitude: 139.0)
      create(:safety_log, work_session: work_session, logged_at: 30.minutes.ago, latitude: 35.1, longitude: 139.1)
      create(:safety_log, work_session: work_session, logged_at: 10.minutes.ago, latitude: 35.2, longitude: 139.2)
    end

    context "WorkSession の所有者の場合" do
      it "時系列順でログ一覧を返す" do
        get "/api/v1/work_sessions/#{work_session.id}/safety_logs",
            headers: user.create_new_auth_token,
            as: :json

        expect(response).to have_http_status(:ok)
        json = response.parsed_body
        expect(json.size).to eq(3)

        # 順番が正しいかチェック
        # 1つ目(index 0) が 1時間前（一番古い）であるべき
        # 3つ目(index 2) が 10分前（一番新しい）であるべき
        first_log_time = Time.zone.parse(json[0]["logged_at"])
        last_log_time  = Time.zone.parse(json[2]["logged_at"])

        expect(first_log_time).to be < last_log_time
      end

      it "latitude/longitude が展開されて返る" do
        get "/api/v1/work_sessions/#{work_session.id}/safety_logs",
            headers: user.create_new_auth_token,
            as: :json

        expect(response).to have_http_status(:ok)
        json = response.parsed_body

        expect(json[0]["latitude"]).to be_present
        expect(json[0]["longitude"]).to be_present
      end

      it "ページネーションヘッダーを返す" do
        get "/api/v1/work_sessions/#{work_session.id}/safety_logs",
            headers: user.create_new_auth_token,
            as: :json

        expect(response).to have_http_status(:ok)
        expect(response.headers["X-Total-Count"]).to eq("3")
        expect(response.headers["X-Total-Pages"]).to eq("1")
        expect(response.headers["X-Per-Page"]).to eq("100")
        expect(response.headers["X-Current-Page"]).to eq("1")
      end
    end

    context "同一組織の他メンバーの場合" do
      it "閲覧可能" do
        other_member = create(:user)
        create(:membership, organization: organization, user: other_member, role: :worker)

        get "/api/v1/work_sessions/#{work_session.id}/safety_logs",
            headers: other_member.create_new_auth_token,
            as: :json

        expect(response).to have_http_status(:ok)
        json = response.parsed_body
        expect(json.size).to eq(3)
      end
    end

    context "別組織のユーザーの場合" do
      it "403 を返す" do
        other_org = create(:organization)
        outsider = create(:user)
        create(:membership, organization: other_org, user: outsider, role: :worker)

        get "/api/v1/work_sessions/#{work_session.id}/safety_logs",
            headers: outsider.create_new_auth_token,
            as: :json

        expect(response).to have_http_status(:forbidden)
        json = response.parsed_body
        expect(json["errors"]).to include("この作業セッションを閲覧する権限がありません")
      end
    end

    context "WorkSession が存在しない場合" do
      it "404 を返す" do
        get "/api/v1/work_sessions/99999/safety_logs",
            headers: user.create_new_auth_token,
            as: :json

        expect(response).to have_http_status(:not_found)
      end
    end

    context "ページネーション" do
      before do
        # 既存の3件に加えて追加で150件作成（合計153件）
        150.times do |i|
          create(:safety_log, work_session: work_session, logged_at: (i + 1).minutes.ago, latitude: 35.0 + (i * 0.001), longitude: 139.0 + (i * 0.001))
        end
      end

      it "デフォルトで1ページ目を100件返す" do
        get "/api/v1/work_sessions/#{work_session.id}/safety_logs",
            headers: user.create_new_auth_token,
            as: :json

        expect(response).to have_http_status(:ok)
        json = response.parsed_body
        expect(json.size).to eq(100)
        expect(response.headers["X-Total-Count"]).to eq("153")
        expect(response.headers["X-Total-Pages"]).to eq("2")
        expect(response.headers["X-Current-Page"]).to eq("1")
      end

      it "page パラメータで2ページ目を取得できる" do
        get "/api/v1/work_sessions/#{work_session.id}/safety_logs?page=2",
            headers: user.create_new_auth_token,
            as: :json

        expect(response).to have_http_status(:ok)
        json = response.parsed_body
        expect(json.size).to eq(53)
        expect(response.headers["X-Current-Page"]).to eq("2")
      end

      it "per_page パラメータで件数を変更できる" do
        get "/api/v1/work_sessions/#{work_session.id}/safety_logs?per_page=50",
            headers: user.create_new_auth_token,
            as: :json

        expect(response).to have_http_status(:ok)
        json = response.parsed_body
        expect(json.size).to eq(50)
        expect(response.headers["X-Per-Page"]).to eq("50")
        expect(response.headers["X-Total-Pages"]).to eq("4")
      end

      it "per_page は最大1000件に制限される" do
        get "/api/v1/work_sessions/#{work_session.id}/safety_logs?per_page=5000",
            headers: user.create_new_auth_token,
            as: :json

        expect(response).to have_http_status(:ok)
        expect(response.headers["X-Per-Page"]).to eq("1000")
      end

      it "per_page が0以下の場合はデフォルト100件になる" do
        get "/api/v1/work_sessions/#{work_session.id}/safety_logs?per_page=-10",
            headers: user.create_new_auth_token,
            as: :json

        expect(response).to have_http_status(:ok)
        expect(response.headers["X-Per-Page"]).to eq("100")
      end

      it "page が0以下の場合は1ページ目になる" do
        get "/api/v1/work_sessions/#{work_session.id}/safety_logs?page=-1",
            headers: user.create_new_auth_token,
            as: :json

        expect(response).to have_http_status(:ok)
        expect(response.headers["X-Current-Page"]).to eq("1")
      end

      it "order=desc パラメータで降順取得できる" do
        get "/api/v1/work_sessions/#{work_session.id}/safety_logs?order=desc&per_page=5",
            headers: user.create_new_auth_token,
            as: :json

        expect(response).to have_http_status(:ok)
        json = response.parsed_body

        # 降順なので最新のログが最初に来る
        first_log_time = Time.zone.parse(json[0]["logged_at"])
        last_log_time  = Time.zone.parse(json[4]["logged_at"])

        expect(first_log_time).to be > last_log_time
      end
    end
  end

  describe "DELETE /api/v1/work_sessions/:work_session_id/safety_logs/:id (元気タッチ取り消し)" do
    let!(:check_in_log) { create(:safety_log, :check_in, work_session: work_session) }

    context "WorkSession の所有者の場合" do
      it "check_in ログを取り消せる" do
        delete "/api/v1/work_sessions/#{work_session.id}/safety_logs/#{check_in_log.id}",
               headers: user.create_new_auth_token,
               as: :json

        expect(response).to have_http_status(:ok)
        expect(response.parsed_body["status"]).to eq("success")
        expect(SafetyLog.find_by(id: check_in_log.id)).to be_nil
      end

      it "期限を過ぎたら取り消せない" do
        travel_to(check_in_log.created_at + SafetyLog::UNDOABLE_WINDOW + 5.seconds) do
          delete "/api/v1/work_sessions/#{work_session.id}/safety_logs/#{check_in_log.id}",
                 headers: user.create_new_auth_token,
                 as: :json

          expect(response).to have_http_status(:unprocessable_content)
          expect(response.parsed_body["errors"]).to include("取り消し可能な時間を過ぎています")
        end
      end

      it "check_in 以外は取り消せない" do
        heartbeat_log = create(:safety_log, work_session: work_session)

        delete "/api/v1/work_sessions/#{work_session.id}/safety_logs/#{heartbeat_log.id}",
               headers: user.create_new_auth_token,
               as: :json

        expect(response).to have_http_status(:unprocessable_content)
        expect(response.parsed_body["errors"]).to include("このログは取り消しできません")
      end
    end

    context "認可エラーの場合" do
      it "他人の WorkSession のログは取り消せず 403" do
        other_user = create(:user)
        create(:membership, organization: organization, user: other_user, role: :worker)

        delete "/api/v1/work_sessions/#{work_session.id}/safety_logs/#{check_in_log.id}",
               headers: other_user.create_new_auth_token,
               as: :json

        expect(response).to have_http_status(:forbidden)
        expect(response.parsed_body["errors"]).to include("作業セッションの所有者のみログを削除できます")
      end
    end

    context "ログが存在しない場合" do
      it "404 を返す" do
        delete "/api/v1/work_sessions/#{work_session.id}/safety_logs/99999",
               headers: user.create_new_auth_token,
               as: :json

        expect(response).to have_http_status(:not_found)
        expect(response.parsed_body["errors"]).to include("ログが見つかりません")
      end
    end
  end
end
