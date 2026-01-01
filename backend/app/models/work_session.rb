begin
  require "sidekiq/api"
rescue LoadError
  Rails.logger.info("Sidekiq gem not available; running without Sidekiq integration")
end

class WorkSession < ApplicationRecord
  belongs_to :user
  belongs_to :organization
  belongs_to :created_by_user, class_name: "User", optional: true
  has_many :safety_logs, dependent: :destroy
  has_many :alerts, dependent: :destroy

  enum :status, { in_progress: 0, completed: 1, cancelled: 2 }

  MONITORING_DELAY = 30.minutes

  validates :started_at, presence: true

  scope :active, -> { where(status: :in_progress) }
  scope :recent, -> { order(started_at: :desc) }

  # コールバック
  # - 新規作成時に started_at/status のデフォルトを設定する
  before_validation :set_default_started_at, on: :create
  # - DB 保存後に監視ジョブをスケジュールして JID を保存する
  after_commit :schedule_monitoring_job, on: :create

  # 正常終了処理
  # - 監視ジョブをキャンセルする
  # - ended_at を設定して status を :completed に更新する
  def end!(attrs = {})
    end_time = attrs&.dig(:ended_at) || Time.current
    cancel_scheduled_job
    update!(ended_at: end_time, status: :completed)
  end

  # キャンセル処理
  # - in_progress のときのみ実行
  # - 監視ジョブを取消し、ended_at と status を更新する
  def cancel!
    return unless in_progress?

    cancel_scheduled_job
    update!(ended_at: Time.current, status: :cancelled)
  end

  # 実行中判定
  # - in_progress かつ ended_at が nil の場合に true
  def active?
    in_progress? && ended_at.nil?
  end

  # 監視ジョブの抽象ステータスを返す
  # - "scheduled": scheduled_at が将来時刻で予約されている
  # - "running"  : active_monitoring_jid が存在し、即時実行中または実行中と判断される
  # - "none"     : 監視ジョブが存在しない
  def monitoring_status
    # 優先度: scheduled_at の未来 -> scheduled、次に JID による running
    return "scheduled" if scheduled_at.present? && scheduled_at > Time.current

    # JID があれば running
    return "running" if active_monitoring_jid.present?

    # 上記に該当しなければ監視ジョブは存在しない
    "none"
  end

  private

  # 新規作成時のデフォルト設定
  # - started_at がなければ現在時刻を設定
  # - status が未設定なら :in_progress を設定
  def set_default_started_at
    self.started_at ||= Time.current
    self.status ||= :in_progress
  end

  # 監視ジョブのスケジュール
  # - MONITORING_DELAY 後にジョブを登録し、返却された JID と scheduled_at を DB に保存する
  # - JID を保存しておくことで、終了時に正しく予約を取り消せる
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

  # 予約ジョブの取消と DB のクリーンアップ
  # - Redis(Sidekiq) 上の予約を削除し、active_monitoring_jid / scheduled_at を nil にする
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
