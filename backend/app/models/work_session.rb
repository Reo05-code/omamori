# ワークセッションモデルを上書き
cat > backend/app/models/work_session.rb <<'RUBY'
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

  # 30分後に監視ジョブをスケジュールし、その jid を保存する
  # その処理を後からキャンセルできるようにする
  # セッション終了時に確実にキャンセルする
  def schedule_monitoring_job
    # 監視ジョブをスケジュールし、Sidekiq Client API で jid を取得して保存する
    scheduled_time = 30.minutes.from_now
    jid = nil

    if defined?(Sidekiq)
      begin
        # ActiveJob の SidekiqAdapter 用の JobWrapper に渡すシリアライズ済みのジョブペイロードを作成して予定登録する
        payload = {
          'job_class' => MonitorWorkSessionJob.name,
          'job_id' => SecureRandom.uuid,
          'queue_name' => (MonitorWorkSessionJob.queue_name || 'default'),
          'arguments' => [id]
        }

        # ActiveJob を経由せず、Sidekiq の Client API を直接使って jid を取得
        jid = Sidekiq::Client.push('class' => 'ActiveJob::QueueAdapters::SidekiqAdapter::JobWrapper', 'args' => [payload], 'at' => scheduled_time.to_f)
      rescue StandardError => e
        Rails.logger.warn("Failed to push Sidekiq scheduled job for WorkSession=#{id}: #{e.message}")
      end
    else
      # Sidekiq が無ければ ActiveJob を使ってスケジュールし、provider_job_id 等が取れれば保存する
      job = MonitorWorkSessionJob.set(wait: 30.minutes).perform_later(id)
      jid = job.provider_job_id if job.respond_to?(:provider_job_id)
      jid ||= job.job_id if job.respond_to?(:job_id)
    end

    if jid.present?
      begin
        update_columns(active_monitoring_jid: jid, scheduled_at: scheduled_time)
      rescue StandardError => e
        Rails.logger.warn("Failed to save active_monitoring_jid=#{jid} for WorkSession=#{id}: #{e.message}")
        # DB 保存に失敗した場合、スケジュール済みジョブを削除して不整合を残さない
        if defined?(Sidekiq)
          begin
            scheduled = Sidekiq::ScheduledSet.new
            job = scheduled.find { |j| j.jid == jid }
            if job
              job.delete
              Rails.logger.info("Rolled back scheduled job #{jid} for WorkSession=#{id} after DB save failure")
            end
          rescue StandardError => ex
            Rails.logger.warn("Failed to rollback scheduled job #{jid}: #{ex.message}")
          end
        end
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

    # 状態の不整合を残さない。「このセッションにはもう監視ジョブはない」ことを明示
    begin
      update_columns(active_monitoring_jid: nil, scheduled_at: nil)
    rescue StandardError => e
      Rails.logger.warn("Failed to clear active_monitoring_jid/scheduled_at for WorkSession=#{id}: #{e.message}")
    end
  end
end
