class Alert < ApplicationRecord
  belongs_to :work_session
  belongs_to :safety_log, optional: true
  belongs_to :handled_by_user, class_name: "User", optional: true

  ALERT_TYPES = %w[timeout sos battery risk_high].freeze

  enum :status, { open: 0, in_progress: 1, resolved: 2 }, prefix: true

  validates :alert_type, presence: true, inclusion: { in: ALERT_TYPES }
end
