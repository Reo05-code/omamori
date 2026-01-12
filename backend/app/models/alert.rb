# frozen_string_literal: true

class Alert < ApplicationRecord
  belongs_to :work_session
  belongs_to :safety_log, optional: true
  belongs_to :handled_by_user, class_name: "User", optional: true

  enum :alert_type, {
    sos: 0,
    risk_high: 1,
    risk_medium: 2,
    battery_low: 3,
    timeout: 4
  }, prefix: true

  enum :severity, {
    low: 0,
    medium: 1,
    high: 2,
    critical: 3
  }

  enum :status, {
    open: 0,
    in_progress: 1,
    resolved: 2
  }, prefix: true

  ALERT_TYPES = alert_types.keys.freeze

  validates :alert_type, presence: true

  scope :unresolved, -> { where(status: %i[open in_progress]) }
  scope :notifiable, -> { where(severity: %i[high critical]).unresolved }

  scope :urgent, lambda {
    where(status: :open).where(alert_type: :sos).or(where(status: :open).where(severity: :critical))
  }

  scope :not_urgent, -> { where.not(id: urgent.select(:id)) }

  scope :order_by_priority, lambda {
    unresolved_first = sanitize_sql_array([<<-SQL.squish, statuses[:open], statuses[:in_progress]])
      CASE WHEN alerts.status IN (?, ?) THEN 0 ELSE 1 END
    SQL

    critical = severities[:critical]
    high = severities[:high]
    medium = severities[:medium]
    low = severities[:low]

    severity_rank = sanitize_sql_array([<<-SQL.squish, critical, high, medium, low])
      CASE alerts.severity
        WHEN ? THEN 0
        WHEN ? THEN 1
        WHEN ? THEN 2
        WHEN ? THEN 3
        ELSE 4
      END
    SQL

    order(Arel.sql(unresolved_first))
      .order(Arel.sql(severity_rank))
      .order(created_at: :desc)
  }
end
