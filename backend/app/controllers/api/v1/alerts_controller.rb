# frozen_string_literal: true

module Api
  module V1
    class AlertsController < ApplicationController
      before_action :authenticate_user!

      # POST /api/v1/work_sessions/:work_session_id/alerts
      def create
        work_session = find_work_session
        result = create_alert_for(work_session)
        render_alert_result(result)
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Work session not found" }, status: :not_found
      end

      private

      def find_work_session
        current_user.work_sessions.find(params[:work_session_id])
      end

      def create_alert_for(work_session)
        AlertCreationService.new(
          work_session: work_session,
          alert_type: :sos,
          severity: :critical,
          lat: params[:latitude],
          lon: params[:longitude]
        ).call
      end

      def render_alert_result(result)
        if result.duplicate?
          render json: { message: "Duplicate alert detected", alert: result.alert }, status: :ok
        elsif result.success?
          render json: result.alert, status: :created
        else
          render json: { errors: result.alert.errors.full_messages }, status: :unprocessable_content
        end
      end
    end
  end
end
