class AddActiveMonitoringJidToWorkSessions < ActiveRecord::Migration[7.2]
  def change
    add_column :work_sessions, :active_monitoring_jid, :string
    add_index  :work_sessions, :active_monitoring_jid, unique: true

    # 監視ジョブの予定時刻（運用・デバッグ用）
    add_column :work_sessions, :scheduled_at, :datetime
    add_index  :work_sessions, :scheduled_at
  end
end
