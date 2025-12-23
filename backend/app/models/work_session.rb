begin
  require "sidekiq/api"
rescue LoadError
  Rails.logger.info("Sidekiq gem not available; running without Sidekiq integration")
end

class WorkSession < ApplicationRecord
  belongs_to :user
  belongs_to :organization

  enum :status, { in_progress: 0, completed: 1, cancelled: 2 }

  MONITORING_DELAY = 30.minutes

  validates :started_at, presence: true

  scope :active, -> { where(status: :in_progress) }
  scope :recent, -> { order(started_at: :desc) }

  # 作成時に開始時刻とステータスのデフォルト設定
  before_validation :set_default_started_at, on: :create
  # DB保存確定後にジョブ登録
  after_commit :schedule_monitoring_job, on: :create

  # セッションを正常終了させる。関連する予約ジョブをキャンセルし、終了時刻と状態を更新する。
  def end!(attrs = {})
    end_time = attrs&.dig(:ended_at) || Time.current
    cancel_scheduled_job
    update!(ended_at: end_time, status: :completed)
  end

  # 実行中のセッションをキャンセルする。ジョブ取消と状態更新を行う。
  def cancel!
    return unless in_progress?

    cancel_scheduled_job
    update!(ended_at: Time.current, status: :cancelled)
  end

  # セッションが現在実行中で未終了かどうかを判定する。
  def active?
    in_progress? && ended_at.nil?
  end

  # 監視ジョブの抽象ステータスを返す。フロントは Sidekiq の内部を知らなくて良い。
  # - "running"  : ジョブが実行中または即時実行（scheduled_at が過去 or nil だが jid がある）
  # - "scheduled": 監視ジョブが予約済み（scheduled_at が将来時刻）
  # - "none"     : 監視ジョブが存在しない
  def monitoring_status
    # まず scheduled_at が将来なら予約済みとみなす（JID が入っていても予約状態の可能性がある）
    return "scheduled" if scheduled_at.present? && scheduled_at > Time.current

    # 次に JID が存在する場合は実行中または即時実行と判断
    return "running" if active_monitoring_jid.present?

    # 上記に該当しなければ監視ジョブは存在しない
    "none"
  end

  private

  # 新規作成時に開始時刻とステータスのデフォルトを設定する（テストや外部入力がない場合に備える）。
  def set_default_started_at
    self.started_at ||= Time.current
    self.status ||= :in_progress
  end

  # 30分後に監視ジョブをスケジュールし、その jid を保存する
  # JID を保存することで、セッション終了時に確実にジョブをキャンセルできる（誤通知防止）
  def schedule_monitoring_job
    scheduled_time = MONITORING_DELAY.from_now

    begin
      jid = push_monitoring_job(scheduled_time)
    rescue StandardError => e
      Rails.logger.warn("Failed to push monitoring job for WorkSession=#{id}: #{e.message}")
      return
    end

    begin
      save_jid(jid, scheduled_time) if jid.present?
    rescue StandardError => e
      Rails.logger.warn("Failed to save jid for WorkSession=#{id}: #{e.message}")
    end
  end

  # 予約済みジョブを Redis から削除し、DB上の JID もクリアする
  def cancel_scheduled_job
    jid = active_monitoring_jid
    return if jid.blank?

    # Sidekiq が利用可能か明示的に確認してからスケジュール削除を試みる
    if defined?(Sidekiq::ScheduledSet)
      begin
        delete_scheduled_job(jid)
      rescue StandardError => e
        Rails.logger.warn("Failed to delete scheduled job #{jid} for WorkSession=#{id}: #{e.message}")
      end
    end

    begin
      update!(active_monitoring_jid: nil, scheduled_at: nil)
    rescue StandardError => e
      Rails.logger.warn("Failed to clear active_monitoring_jid/scheduled_at for WorkSession=#{id}: #{e.message}")
    end
  end
  include WorkSessionMonitoring
end
