class WorkSession < ApplicationRecord
  belongs_to :user
  belongs_to :organization


  enum status: { in_progress: 0, completed: 1, cancelled: 2 }

  validates :started_at, presence: true

  scope :active, -> { where(status: :in_progress) }
  scope :recent, -> { order(started_at: :desc) }

  # DB保存確定後にジョブ登録
  after_commit :schedule_monitoring_job, on: :create

  # 作成時に開始時刻とステータスのデフォルト設定
  before_validation :set_default_started_at, on: :create

  # 正常終了処理
  def end!(attrs = {})
    end_time = attrs&.dig(:ended_at) || Time.current
    update!(ended_at: end_time, status: :completed)
  end

  def cancel!
    return unless in_progress?

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
    MonitorWorkSessionJob.perform_later(id)
  end
end
