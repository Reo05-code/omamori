# frozen_string_literal: true

module WorkSessionMonitoring
  extend ActiveSupport::Concern

  # Sidekiq Client API を直接使用して JID を確実に取得する（ActiveJob経由では取得できないため）
  # ただしテスト環境（ActiveJob の test adapter 使用時）は ActiveJob 経由で
  # エンキューして `have_enqueued_job` 等のマッチャが機能するようにする。
  # Redis 接続失敗時は ActiveJob へフォールバックする。
  def push_monitoring_job(scheduled_time)
    use_active_job = Rails.env.test? || ActiveJob::Base.queue_adapter == :test

    return push_via_active_job if use_active_job || !defined?(Sidekiq)

    jid = nil
    begin
      payload = build_monitoring_payload
      jid = push_via_sidekiq(payload, scheduled_time)
    rescue StandardError => e
      Rails.logger.warn("Sidekiq push failed for WorkSession=#{id}, falling back to ActiveJob: #{e.message}")
    end

    # Sidekiq push が失敗した場合は ActiveJob にフォールバック
    jid.presence || push_via_active_job
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
  # Redis 未接続時は処理をスキップ。
  def rollback_scheduled_job(jid)
    return unless defined?(Sidekiq)

    begin
      scheduled = Sidekiq::ScheduledSet.new
      job = scheduled.find { |j| j.jid == jid }
      if job
        job.delete
        Rails.logger.info("Rolled back scheduled job #{jid} for WorkSession=#{id} after DB save failure")
      end
    rescue StandardError => e
      Rails.logger.warn("Failed to rollback scheduled job #{jid}: #{e.message}")
    end
  end

  # 指定した JID の予約ジョブを Redis の ScheduledSet から削除する。
  # Redis 未接続時はログ出力のみ行い、処理は継続する。
  def delete_scheduled_job(jid)
    return unless defined?(Sidekiq)

    begin
      require "sidekiq/api"
      scheduled = Sidekiq::ScheduledSet.new
      job = scheduled.find { |j| j.jid == jid }
      job&.delete
    rescue StandardError => e
      Rails.logger.warn("Failed to cancel scheduled Sidekiq job #{jid}: #{e.message}")
    end
  end

  private :push_monitoring_job, :build_monitoring_payload, :push_via_sidekiq, :push_via_active_job,
          :save_jid, :rollback_scheduled_job, :delete_scheduled_job
end
