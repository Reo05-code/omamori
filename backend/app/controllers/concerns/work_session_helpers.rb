# frozen_string_literal: true

module WorkSessionHelpers
  extend ActiveSupport::Concern

  # 内容:
  # - パラメータ抽出、作成前チェック、保存時の排他制御、エラーレスポンス生成などを提供する。
  # - ポリシー判定やシリアライザ呼び出しはコントローラ側で行い、このモジュールは補助的な役割にとどめる。

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
  # target_user 指定に対応
  def render_active_session_exists?(target_user = current_user)
    if target_user.work_sessions.active.exists?
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

  def build_new_work_session(org, target_user)
    target_user.work_sessions.build(
      organization: org,
      started_at: started_at_param.presence || Time.current,
      status: :in_progress,
      created_by_user: current_user
    )
  end

  # 対象ユーザーを決定（user_id パラメータがある場合は指定ユーザー、なければ自分）
  # 代理操作には組織内のadmin権限が必要（なりすまし防止）
  # 権限がない場合は nil を返す
  def determine_target_user(organization)
    user_id = raw_user_id

    # 指定がなければ自分自身
    return current_user if own_user?(user_id)

    # 組織内のadmin権限がなければ nil を返す
    return nil unless current_user_admin_in_org?(organization)

    # 権限があれば検索して返す
    organization.users.find(user_id)
  end

  private

  def raw_user_id
    params.dig(:work_session, :user_id) || params[:user_id]
  end

  def own_user?(user_id)
    user_id.blank? || user_id.to_s == current_user.id.to_s
  end

  def current_user_admin_in_org?(organization)
    membership = current_user.memberships.find_by(organization_id: organization.id)
    membership&.admin?
  end

  def policy_create_status(work_session)
    result = WorkSessionPolicy.new(current_user, work_session).create
    return :forbidden if result.error_key == :forbidden
    return :not_found if result.error_key == :not_found

    :ok
  end

  def ensure_authorized_for?(action, work_session)
    result = WorkSessionPolicy.new(current_user, work_session).public_send(action)
    unless result.allowed?
      render_work_session_not_found
      return false
    end

    true
  end
end
