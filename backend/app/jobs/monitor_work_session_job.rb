class MonitorWorkSessionJob < ApplicationJob
  queue_as :default

  def perform(work_session_id)
    session = WorkSession.find_by(id: work_session_id)
    return unless session&.in_progress? && session.ended_at.nil?

    # 通知・エスカレーション処理をここに実装します。
    # 例:
    # - ActiveJobs/Sidekiq による warning/emergency ジョブ作成（active_jobs テーブルへ登録）
    # - Alert レコードの作成: Alerts.create!(work_session: session, alert_type: 'timeout', status: 0)
    # - AI リスク解析ジョブを enqueue（ai_risk_analysis を実装する場合）

    Rails.logger.info("MonitorWorkSessionJob: processed work_session_id=#{work_session_id}")
  end
end
