# frozen_string_literal: true

module Api
  module V1
    class SafetyLogsController < ApplicationController
      before_action :authenticate_user!
      before_action :set_work_session

      rescue_from ActiveRecord::RecordNotFound, with: :render_record_not_found
      rescue_from ActiveRecord::RecordInvalid, with: :render_record_invalid
      rescue_from SafetyLogs::UndoService::Forbidden, with: :render_forbidden
      rescue_from SafetyLogs::UndoService::NotUndoable, with: :render_unprocessable
      rescue_from SafetyLogs::UndoService::Expired, with: :render_unprocessable
      rescue_from SafetyLogs::CreateService::Forbidden, with: :render_forbidden

      # GET /api/v1/work_sessions/:work_session_id/safety_logs
      # 指定セッションの移動履歴取得
      def index
        # 同一組織のメンバーのみ閲覧可能
        unless can_view_work_session?
          render json: { errors: ["この作業セッションを閲覧する権限がありません"] }, status: :forbidden
          return
        end

        # 時系列でログを取得（地図描画向け）
        logs = @work_session.safety_logs.order(logged_at: :asc)

        render json: Api::V1::SafetyLogSerializer.new(logs).as_json
      end

      # POST /api/v1/work_sessions/:work_session_id/safety_logs
      # ログ受信とリスク判定(同期)
      def create
        result = SafetyLogs::CreateService.new(
          work_session: @work_session,
          actor: current_user,
          attributes: safety_log_params.to_h
        ).call!

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
          :weather_temp,
          :weather_condition,
          :is_offline_sync,
          :logged_at
        )
      end
    end
  end
end
