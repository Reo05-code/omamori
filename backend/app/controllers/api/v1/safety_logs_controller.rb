# frozen_string_literal: true

module Api
  module V1
    class SafetyLogsController < ApplicationController
      before_action :authenticate_user!
      before_action :set_work_session

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

        render json: logs.map { |log| Api::V1::SafetyLogSerializer.new(log).as_json }
      end

      # POST /api/v1/work_sessions/:work_session_id/safety_logs
      # ログ受信とリスク判定(同期)
      def create
        unless @work_session.user_id == current_user.id
          render json: { errors: ["作業セッションの所有者のみログを送信できます"] }, status: :forbidden
          return
        end

        safety_log = build_safety_log
        if safety_log.save
          render_success_with_assessment(safety_log)
        else
          render json: { errors: safety_log.errors.full_messages }, status: :unprocessable_content
        end
      end

      private

      def set_work_session
        @work_session = WorkSession.find(params[:work_session_id])
      rescue ActiveRecord::RecordNotFound
        render json: { errors: ["作業セッションが見つかりません"] }, status: :not_found
      end

      def build_safety_log
        safety_log = @work_session.safety_logs.build(safety_log_params)
        safety_log.logged_at ||= Time.current
        safety_log
      end

      def render_success_with_assessment(safety_log)
        assessment = RiskAssessmentService.new(safety_log).call

        render json: {
          status: "success",
          safety_log: Api::V1::SafetyLogSerializer.new(safety_log).as_json,
          risk_level: assessment[:risk_level],
          risk_reasons: assessment[:risk_reasons],
          next_poll_interval: assessment[:next_poll_interval]
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
          :weather_temp,
          :weather_condition,
          :is_offline_sync,
          :logged_at
        )
      end
    end
  end
end
