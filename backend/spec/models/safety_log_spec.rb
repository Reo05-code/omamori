# frozen_string_literal: true

require "rails_helper"

RSpec.describe SafetyLog do
  describe "Associations" do
    it { is_expected.to belong_to(:work_session) }
  end

  describe "Validations" do
    subject { build(:safety_log) }

    it { is_expected.to validate_presence_of(:logged_at) }
    it { is_expected.to validate_presence_of(:battery_level) }
    it { is_expected.to validate_presence_of(:trigger_type) }

    it { is_expected.to validate_numericality_of(:battery_level).only_integer.is_in(0..100) }

    it "gps_accuracy が nil でも有効" do
      log = build(:safety_log, gps_accuracy: nil)
      expect(log).to be_valid
    end

    it "gps_accuracy が負数の場合は無効" do
      log = build(:safety_log, gps_accuracy: -1.0)
      expect(log).not_to be_valid
      expect(log.errors[:gps_accuracy]).to be_present
    end
  end

  describe "Enum: trigger_type" do
    it "heartbeat を設定できる" do
      log = build(:safety_log, trigger_type: :heartbeat)
      expect(log).to be_trigger_type_heartbeat
    end

    it "sos を設定できる" do
      log = build(:safety_log, trigger_type: :sos)
      expect(log).to be_trigger_type_sos
    end

    it "check_in を設定できる" do
      log = build(:safety_log, trigger_type: :check_in)
      expect(log).to be_trigger_type_check_in
    end
  end

  describe "Geography: lonlat" do
    it "latitude と longitude から lonlat が生成される" do
      log = create(:safety_log, latitude: 35.6812, longitude: 139.7671)

      expect(log.lonlat).to be_present
      expect(log.latitude).to be_within(0.0001).of(35.6812)
      expect(log.longitude).to be_within(0.0001).of(139.7671)
    end

    it "latitude が範囲外の場合はエラー" do
      log = build(:safety_log, latitude: 91.0, longitude: 139.0)

      expect(log).not_to be_valid
      expect(log.errors[:latitude]).to be_present
    end

    it "longitude が範囲外の場合はエラー" do
      log = build(:safety_log, latitude: 35.0, longitude: 181.0)

      expect(log).not_to be_valid
      expect(log.errors[:longitude]).to be_present
    end

    it "latitude のみ指定された場合はエラー" do
      log = build(:safety_log, latitude: 35.0, longitude: nil)

      expect(log).not_to be_valid

      expect(log.errors[:base]).to include("緯度と経度はセットで入力してください")
    end

    it "longitude のみ指定された場合はエラー" do
      log = build(:safety_log, latitude: nil, longitude: 139.0)

      expect(log).not_to be_valid
      expect(log.errors[:base]).to include("緯度と経度はセットで入力してください")
    end
  end

  describe "Scopes" do
    let!(:high_acc_log) { create(:safety_log, gps_accuracy: 10.0) }
    let!(:low_acc_log) { create(:safety_log, gps_accuracy: 100.0) }

    describe ".high_accuracy" do
      it "GPS 精度が 50m 以下のログのみ返す" do
        results = described_class.high_accuracy
        expect(results).to include(high_acc_log)
        expect(results).not_to include(low_acc_log)
      end
    end

    describe ".recent" do
      let!(:old_log) { create(:safety_log, logged_at: 1.hour.ago) }
      let!(:new_log) { create(:safety_log, logged_at: Time.current) }

      it "最新のログが先に返される" do
        results = described_class.recent
        expect(results.first).to eq(new_log)
        expect(results.last).to eq(old_log)
      end
    end
  end

  describe "Factory traits" do
    it ":sos trait が動作する" do
      log = create(:safety_log, :sos)
      expect(log).to be_trigger_type_sos
    end

    it ":check_in trait が動作する" do
      log = create(:safety_log, :check_in)
      expect(log).to be_trigger_type_check_in
    end

    it ":low_battery trait が動作する" do
      log = create(:safety_log, :low_battery)
      expect(log.battery_level).to be <= 10
    end

    it ":high_accuracy trait が動作する" do
      log = create(:safety_log, :high_accuracy)
      expect(log.gps_accuracy).to be <= 10.0
    end

    it ":offline_synced trait が動作する" do
      log = create(:safety_log, :offline_synced)
      expect(log.is_offline_sync).to be true
    end
  end
end
