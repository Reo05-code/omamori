require "rails_helper"

RSpec.describe AlertCreationService do
  # 共通の事前準備
  let(:work_session) { create(:work_session) }
  # デフォルトのパラメータ（テストケースごとに上書き可能）
  let(:default_params) do
    {
      work_session: work_session,
      alert_type: :sos,
      severity: :critical,
      lat: nil,
      lon: nil
    }
  end

  describe "#call" do
    subject(:service_call) { described_class.new(**params).call }

    context "重複がある場合" do
      let(:params) { default_params }

      before do
        # 直近の同種オープンアラートを作成
        create(:alert,
               work_session: work_session,
               alert_type: :sos,
               status: :open,
               created_at: 1.minute.ago)
      end

      it "重複と判定され、既存のアラートを返す" do
        expect(service_call.duplicate?).to be true
        expect(service_call.success?).to be false
        expect(service_call.alert).to be_persisted
      end
    end

    context "位置情報がある場合 (正常系)" do
      let(:params) { default_params.merge(lat: 35.0, lon: 139.0) }

      it "SafetyLogを作成してアラートに紐付ける" do
        expect { service_call }.to change(SafetyLog, :count).by(1)

        result = service_call
        expect(result.success?).to be true

        created_alert = result.alert
        expect(created_alert.safety_log).to be_present

        # 環境依存を防ぐため be_within を使用
        # RGeo等の実装によっては浮動小数点の誤差が出る可能性があるため
        # 環境によっては lonlat が文字列で返るため、DB側で ST_X/ST_Y を使って検証する
        # 例）coords = {"lat" => "35.0", "lon" => "139.0"}
        coords = SafetyLog.connection.select_one("SELECT ST_Y(lonlat::geometry) AS lat, ST_X(lonlat::geometry) AS lon FROM safety_logs WHERE id = #{created_alert.safety_log.id}")
        expect(coords["lat"].to_f).to be_within(0.0001).of(35.0)
        expect(coords["lon"].to_f).to be_within(0.0001).of(139.0)
      end
    end

    context "通知の条件を満たす場合" do
      let(:params) { default_params } # severity: :critical

      it "通知処理（ログ出力）が実行される" do
        notifiable_scope = instance_double(ActiveRecord::Relation)
        allow(Alert).to receive(:notifiable).and_return(notifiable_scope)
        allow(notifiable_scope).to receive(:exists?).with(id: kind_of(Integer)).and_return(true)

        allow(Rails.logger).to receive(:info)

        service_call

        expect(Rails.logger).to have_received(:info).with(/Notification triggered/)
      end
    end

    context "SafetyLog作成に失敗した場合" do
      let(:params) { default_params.merge(lat: 35.0, lon: 139.0) }

      before do
        # バリデーションエラー等を強制的に発生させる
        allow(work_session.safety_logs).to receive(:create!).and_raise(ActiveRecord::RecordInvalid)
        # エラーログの出力を許可
        allow(Rails.logger).to receive(:error)
      end

      it "アラート作成自体は成功させる" do
        expect { service_call }.to change(Alert, :count).by(1)
        expect(service_call.success?).to be true
        expect(service_call.alert.safety_log_id).to be_nil
      end
    end
  end
end
