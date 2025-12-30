# frozen_string_literal: true

class AlertCreationService
  attr_reader :result

  Result = Struct.new(:alert, :duplicate, :success, keyword_init: true) do
    def duplicate?
      duplicate
    end

    def success?
      success
    end
  end

  def initialize(work_session:, alert_type:, severity:, **opts)
    @work_session = work_session
    @alert_type = alert_type
    @severity = severity
    @safety_log_id = opts[:safety_log_id]
    @lat = opts[:lat]
    @lon = opts[:lon]
  end

  def call
    return duplicate_result if duplicate_alert_exists?

    # SOS用ログ作成
    ensure_safety_log_exists!

    alert = build_alert
    save_alert(alert)
  end

  def duplicate_result
    Result.new(alert: @existing_alert, duplicate: true, success: false)
  end

  def build_alert
    @work_session.alerts.build(
      alert_type: @alert_type,
      severity: @severity,
      status: :open,
      safety_log_id: @safety_log_id
    )
  end

  def save_alert(alert)
    if alert.save
      notify_if_needed(alert)
      Result.new(alert: alert, duplicate: false, success: true)
    else
      Result.new(alert: alert, duplicate: false, success: false)
    end
  end

  private

  def duplicate_alert_exists?
    @existing_alert = @work_session.alerts
                                   .where(alert_type: @alert_type, status: :open)
                                   .where("created_at > ?", 5.minutes.ago)
                                   .first
    @existing_alert.present?
  end

  def ensure_safety_log_exists!
    # 既にログIDがある、または位置情報がない場合は何もしない
    return if @safety_log_id.present?
    return unless @lat.present? && @lon.present?

    log = @work_session.safety_logs.create!(
      logged_at: Time.current,
      lonlat: "POINT(#{@lon} #{@lat})",
      # スキーマ定義: 1 = sos
      trigger_type: 1,
      # APIから来ていない場合は 0
      battery_level: 0,
      is_offline_sync: false
    )
    @safety_log_id = log.id
  rescue ActiveRecord::RecordInvalid => e
    # ログ作成に失敗してもアラート自体は止めたくないためログ出力のみ
    Rails.logger.error("Failed to create snapshot safety log: #{e.message}")
  end

  def notify_if_needed(alert)
    return unless Alert.notifiable.exists?(id: alert.id)

    Rails.logger.info "Notification triggered for Alert ##{alert.id}"
  end
end
