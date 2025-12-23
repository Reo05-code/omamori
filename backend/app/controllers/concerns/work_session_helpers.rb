# frozen_string_literal: true

module WorkSessionHelpers
  extend ActiveSupport::Concern

  # ActiveRecord::RecordInvalid のエラーメッセージを JSON で返す
  def render_validation_errors(error, fallback:)
    messages = error.record.errors.full_messages.presence || [fallback]
    render json: { errors: messages }, status: :unprocessable_content
  end

  # リクエストから organization_id を取り出す
  def organization_id_param
    params.dig(:work_session, :organization_id) || params[:organization_id]
  end

  # current_user に紐づく Organization を取得（存在しなければ例外）
  def find_user_organization!(organization_id)
    raise ActiveRecord::RecordNotFound if organization_id.blank?

    current_user.organizations.find(organization_id)
  end

  # 既に進行中のセッションがあれば JSON でエラーを返す
  def render_active_session_exists?
    if current_user.work_sessions.active.exists?
      render json: { errors: ["既に進行中の作業セッションがあります"] }, status: :unprocessable_content
      return true
    end

    false
  end

  # 作成したセッションを Created で返す
  def render_created(session)
    render json: Api::V1::WorkSessionSerializer.new(session).as_json, status: :created
  end

  # finish 実行前の状態チェック（キャンセル済み／既に完了している場合は false）
  def finish_precheck?(work_session)
    if work_session.cancelled?
      render json: { errors: ["作業セッションはキャンセルされています"] }, status: :unprocessable_content
      return false
    end

    if work_session.completed?
      render json: { errors: ["作業セッションは既に終了しています"] }, status: :unprocessable_content
      return false
    end

    true
  end
end
