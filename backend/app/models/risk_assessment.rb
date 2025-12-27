# frozen_string_literal: true

class RiskAssessment < ApplicationRecord
  belongs_to :safety_log
  has_one :work_session, through: :safety_log

  enum :level, { safe: 0, caution: 1, danger: 2 }

  REASON_CODES = %w[
    high_temperature moderate_heat low_temperature
    low_battery battery_caution
    long_inactive short_inactive
    outside_home
    rapid_acceleration sos_trigger offline_too_long poor_gps_accuracy
  ].freeze

  validates :score, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :level, presence: true
  validates :details, presence: true

  validate :details_reasons_values

  private

  # details['reasons'] に含まれる値が REASON_CODES のサブセットであることを検証
  def details_reasons_values
    return unless details.is_a?(Hash)

    # 文字列でもシンボルでも扱えるようにする
    safe_details = details.with_indifferent_access

    reasons = Array(safe_details["reasons"]).map(&:to_s)
    return if reasons.empty?

    invalid = reasons - REASON_CODES
    return if invalid.empty?

    errors.add(:details, "contains invalid reasons: #{invalid.join(', ')}")
  end
end
