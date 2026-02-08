# frozen_string_literal: true

module Api
  module V1
    class SafetyLogsController < ApplicationController
      include SafetyLogsErrorHandler
      include SafetyLogsPagination

      before_action :authenticate_user!
      before_action :set_work_session

      # GET /api/v1/work_sessions/:work_session_id/safety_logs
      # 指定セッションの移動履歴取得（ページネーション対応）
      def index
        # 同一組織のメンバーのみ閲覧可能
        unless can_view_work_session?
          render json: { errors: ["この作業セッションを閲覧する権限がありません"] }, status: :forbidden
          return
        end

        page, per_page = pagination_params
        logs = build_safety_logs(page, per_page)

        add_pagination_headers(logs)

        render json: logs.map { |log| Api::V1::SafetyLogSerializer.new(log).as_json }
      end

      # POST /api/v1/work_sessions/:work_session_id/safety_logs
      # ログ受信とリスク判定(同期)
      def create
        return render_demo_user_forbidden if current_user.demo_user?

        result = create_safety_log
        render_safety_log_created(result)
      end

      # DELETE /api/v1/work_sessions/:work_session_id/safety_logs/:id
      # 元気タッチ(=check_in) の取り消し用
      def destroy
        SafetyLogs::UndoService.new(
          work_session: @work_session,
          safety_log_id: params[:id],
          actor: current_user
        ).call!
        render json: { status: "success" }, status: :ok
      end

      private

      def set_work_session
        @work_session = WorkSession.find(params[:work_session_id])
      end

      def render_demo_user_forbidden
        render json: { error: "デモユーザーはログを生成できません" }, status: :forbidden
      end

      def create_safety_log
        SafetyLogs::CreateService.new(
          work_session: @work_session,
          actor: current_user,
          attributes: safety_log_params.to_h
        ).call!
      end

      def render_safety_log_created(result)
        assessment = result[:assessment]

        render json: {
          status: "success",
          safety_log: Api::V1::SafetyLogSerializer.new(result[:safety_log]).as_json,
          risk_level: assessment[:risk_level],
          risk_reasons: assessment[:risk_reasons],
          next_poll_interval: assessment[:next_poll_interval],
          undo_expires_at: result[:undo_expires_at]
        }, status: :created
      end

      # 同一組織のメンバーかどうかを判定
      def can_view_work_session?
        return true if @work_session.user_id == current_user.id

        # WorkSession が紐づく Organization のメンバーかチェック
        current_user.organizations.exists?(@work_session.organization_id)
      end

      def safety_log_params
        params.require(:safety_log).permit(
          :latitude,
          :longitude,
          :battery_level,
          :trigger_type,
          :gps_accuracy,
          :is_offline_sync,
          :logged_at
        )
      end
    end
  end
end
