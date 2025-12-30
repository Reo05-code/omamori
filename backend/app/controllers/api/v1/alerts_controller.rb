# frozen_string_literal: true

module Api
  module V1
    class AlertsController < ApplicationController
      before_action :authenticate_user!

      # POST /api/v1/work_sessions/:work_session_id/alerts
      def create
        work_session = current_user.work_sessions.find(params[:work_session_id])

        result = AlertCreationService.new(
          work_session: work_session,
          alert_type: :sos,
          severity: :critical,
          lat: params[:latitude],
          lon: params[:longitude]
        ).call

        if result.duplicate?
          render json: { message: "Duplicate alert detected", alert: result.alert }, status: :ok
        elsif result.success?
          render json: result.alert, status: :created
        else
          render json: { errors: result.alert.errors.full_messages }, status: :unprocessable_entity
        end
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Work session not found" }, status: :not_found
      end
    end
  end
end
