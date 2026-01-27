# frozen_string_literal: true

module SafetyLogsErrorHandler
  extend ActiveSupport::Concern

  included do
    rescue_from ActiveRecord::RecordNotFound, with: :render_record_not_found
    rescue_from ActiveRecord::RecordInvalid, with: :render_record_invalid
    rescue_from SafetyLogs::UndoService::Forbidden, with: :render_forbidden
    rescue_from SafetyLogs::UndoService::NotUndoable, with: :render_unprocessable
    rescue_from SafetyLogs::UndoService::Expired, with: :render_unprocessable
    rescue_from SafetyLogs::CreateService::Forbidden, with: :render_forbidden
  end

  private

  def render_record_not_found(err)
    if err.respond_to?(:model) && err.model == "WorkSession"
      render json: { errors: ["作業セッションが見つかりません"] }, status: :not_found
      return
    end

    render json: { errors: ["ログが見つかりません"] }, status: :not_found
  end

  def render_record_invalid(err)
    record = err.record
    render json: { errors: record.errors.full_messages }, status: :unprocessable_content
  end

  def render_forbidden(err)
    render json: { errors: [err.message] }, status: :forbidden
  end

  def render_unprocessable(err)
    render json: { errors: [err.message] }, status: :unprocessable_content
  end
end
