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

  # 正常終了処理
  def end!(attrs = {})
    end_time = attrs&.dig(:ended_at) || Time.current
    cancel_scheduled_job
    update!(ended_at: end_time, status: :completed)
  end

  def cancel!
    return unless in_progress?
    cancel_scheduled_job
    update!(ended_at: Time.current, status: :cancelled)
  end

  def active?
    in_progress? && ended_at.nil?
  end

  private

  def set_default_started_at
    self.started_at ||= Time.current
    self.status ||= :in_progress
  end

  def schedule_monitoring_job
    # 監視ジョブをスケジュールし、可能であればプロバイダの jid を保存する。
    # ActiveJob によるスケジューリングを基本とする。Sidekiq 等の一部アダプタは provider_job_id を提供する。
    job = MonitorWorkSessionJob.set(wait: 30.minutes).perform_later(id)

    # ActiveJob のアダプタは enqueue されたジョブオブジェクトを返し、provider_job_id や job_id を参照できる場合がある。
    jid = nil
    jid = job.provider_job_id if job.respond_to?(:provider_job_id)
    jid ||= job.job_id if job.respond_to?(:job_id)

    if jid.present?
      begin
        update_column(:active_monitoring_jid, jid)
      rescue StandardError => e
        Rails.logger.warn("Failed to save active_monitoring_jid=#{jid} for WorkSession=#{id}: #{e.message}")
      end
    end
  end

  # jid が存在する場合にスケジュール済みの Sidekiq ジョブを削除する。Sidekiq が利用できない環境では安全に何もしない。
  def cancel_scheduled_job
    jid = active_monitoring_jid
    return unless jid.present?

    if defined?(Sidekiq)
      begin
        # Redis上の「実行待ちジョブ一覧」を探し、JIDが一致するものを削除（見つからなければ何もしない）
        scheduled = Sidekiq::ScheduledSet.new
        job = scheduled.find { |j| j.jid == jid }
        job.delete if job
      rescue StandardError => e
        Rails.logger.warn("Failed to cancel scheduled Sidekiq job #{jid}: #{e.message}")
      end
    end

    # フィールドはベストエフォートでクリアする。バリデーション／コールバックを回避するために update_column を使用。
    begin
      update_column(:active_monitoring_jid, nil)
    rescue StandardError => e
      Rails.logger.warn("Failed to clear active_monitoring_jid for WorkSession=#{id}: #{e.message}")
    end
  end
end
