require "sidekiq/api"

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

  # Sidekiq Client API を直接使用して JID を確実に取得する（ActiveJob経由では取得できないため）
  # Sidekiq Client API を直接使用して JID を確実に取得する（ActiveJob経由では取得できないため）
  def push_monitoring_job(scheduled_time)
    return push_via_active_job unless defined?(Sidekiq)

    payload = build_monitoring_payload
    push_via_sidekiq(payload, scheduled_time)
  end

  # モニタリングジョブのペイロードを構築する。Sidekiq の JobWrapper に渡す形式。
  def build_monitoring_payload
    {
      "job_class" => MonitorWorkSessionJob.name,
      "job_id" => SecureRandom.uuid,
      "queue_name" => MonitorWorkSessionJob.queue_name || "default",
      "arguments" => [id]
    }
  end

  # Sidekiq Client API を使って予約ジョブを登録し、jid を返す。
  # 例外発生時はログ出力して nil を返す。
  def push_via_sidekiq(payload, scheduled_time)
    Sidekiq::Client.push("class" => "ActiveJob::QueueAdapters::SidekiqAdapter::JobWrapper",
                         "args" => [payload],
                         "at" => scheduled_time.to_f)
  rescue StandardError => e
    Rails.logger.warn("Failed to push Sidekiq scheduled job for WorkSession=#{id}: #{e.message}")
    nil
  end

  # Sidekiq が使えない環境向けのフォールバック。ActiveJob 経由でジョブを登録し、可能であれば provider_job_id を取得する。
  def push_via_active_job
    job = MonitorWorkSessionJob.set(wait: 30.minutes).perform_later(id)
    jid = job.provider_job_id if job.respond_to?(:provider_job_id)
    jid ||= job.job_id if job.respond_to?(:job_id)
    jid
  end

  # DB に JID と scheduled_at を保存する。
  # 保存失敗時は Redis 側の予約をロールバックして不整合を防ぐ。
  def save_jid(jid, scheduled_time)
    update!(active_monitoring_jid: jid, scheduled_at: scheduled_time)
  rescue StandardError => e
    Rails.logger.warn("Failed to save active_monitoring_jid=#{jid} for WorkSession=#{id}: #{e.message}")
    rollback_scheduled_job(jid) if defined?(Sidekiq)
  end

  # DB保存失敗時に Redis 上の予約ジョブを削除する（可能な限り不整合を解消するため）。
  def rollback_scheduled_job(jid)
    scheduled = Sidekiq::ScheduledSet.new
    job = scheduled.find { |j| j.jid == jid }
    if job
      job.delete
      Rails.logger.info("Rolled back scheduled job #{jid} for WorkSession=#{id} after DB save failure")
    end
  rescue StandardError => e
    Rails.logger.warn("Failed to rollback scheduled job #{jid}: #{e.message}")
  end

  # 指定した JID の予約ジョブを Redis の ScheduledSet から削除する。
  def delete_scheduled_job(jid)
    require "sidekiq/api"
    scheduled = Sidekiq::ScheduledSet.new
    job = scheduled.find { |j| j.jid == jid }
    job&.delete
  rescue StandardError => e
    Rails.logger.warn("Failed to cancel scheduled Sidekiq job #{jid}: #{e.message}")
  end
end
