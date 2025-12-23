# frozen_string_literal: true

module ParamsTimeParsing
  extend ActiveSupport::Concern

  private

  # `work_session.started_at` または `started_at` をパースして返す
  # 存在しない場合は nil
  def started_at_param
    raw = params.dig(:work_session, :started_at) || params[:started_at]
    return nil if raw.blank?

    parsed = Time.zone.parse(raw.to_s)
    raise ArgumentError unless parsed

    parsed
  end

  # `work_session.ended_at` または `ended_at` をパースして返す
  # 存在しない場合は nil
  def ended_at_param
    raw = params.dig(:work_session, :ended_at) || params[:ended_at]
    return nil if raw.blank?

    parsed = Time.zone.parse(raw.to_s)
    raise ArgumentError unless parsed

    parsed
  end
end
