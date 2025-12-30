# frozen_string_literal: true

class
   Alert < ApplicationRecord
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

  scope :unresolved, -> { where(status: %i[open in_progress]) }
  scope :notifiable, -> { where(severity: %i[high critical]).unresolved }
  scope :order_by_priority, -> { order(status: :asc, created_at: :desc) }
end
