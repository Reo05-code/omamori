# frozen_string_literal: true

require "rails_helper"

RSpec.describe WorkSession do
  describe "Callbacks" do
    it "started_at がない場合は自動で設定される" do
      ws = build(:work_session, started_at: nil)
      expect(ws).to be_valid
      ws.save!
      expect(ws.started_at).to be_present
    end

    it "作成時に started_at と status が自動設定される" do
      ws = build(:work_session, started_at: nil, status: nil)
      ws.save!

      expect(ws.started_at).to be_present
      expect(ws).to be_in_progress
    end

    it "create 後に MonitorWorkSessionJob が登録される" do
      ActiveJob::Base.queue_adapter = :test

      expect do
        create(:work_session)
      end.to have_enqueued_job(MonitorWorkSessionJob)
    end
  end

  describe "State transitions" do
    it "end! で completed に遷移する" do
      ws = create(:work_session)
      ws.end!

      expect(ws).to be_completed
      expect(ws.ended_at).to be_present
    end

    it "cancel! は in_progress のときのみ有効" do
      ws = create(:work_session)
      ws.cancel!

      expect(ws).to be_cancelled
    end
  end
end
