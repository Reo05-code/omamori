begin
  require "sidekiq/api"
rescue LoadError
  Rails.logger.info("Sidekiq gem not available; running without Sidekiq integration")
end

class WorkSession < ApplicationRecord
  belongs_to :user
  belongs_to :organization

  enum :status, { in_progress: 0, completed: 1, cancelled: 2 }

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

  private

  # 新規作成時に開始時刻とステータスのデフォルトを設定する（テストや外部入力がない場合に備える）。
  def set_default_started_at
    self.started_at ||= Time.current
    self.status ||= :in_progress
  end

  # 30分後に監視ジョブをスケジュールし、その jid を保存する
  # JID を保存することで、セッション終了時に確実にジョブをキャンセルできる（誤通知防止）
  def schedule_monitoring_job
    scheduled_time = 30.minutes.from_now
    jid = push_monitoring_job(scheduled_time)

    save_jid(jid, scheduled_time) if jid.present?
  end

  # 予約済みジョブを Redis から削除し、DB上の JID もクリアする
  def cancel_scheduled_job
    jid = active_monitoring_jid
    return if jid.blank?

    delete_scheduled_job(jid) if defined?(Sidekiq)

    begin
      update!(active_monitoring_jid: nil, scheduled_at: nil)
    rescue StandardError => e
      Rails.logger.warn("Failed to clear active_monitoring_jid/scheduled_at for WorkSession=#{id}: #{e.message}")
    end
  end
  include WorkSessionMonitoring
end
