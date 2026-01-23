# frozen_string_literal: true

module Api
  module V1
    class RiskAssessmentsController < ApplicationController
      before_action :authenticate_user!

      # GET /api/v1/work_sessions/:work_session_id/risk_assessments
      def index
        work_session = find_user_work_session!(params[:work_session_id])

        page, per_page = pagination_params
        assessments = build_assessments(work_session, page, per_page)

        add_pagination_headers(assessments)

        render json: assessments.map { |a| Api::V1::RiskAssessmentSerializer.new(a).as_json }
      rescue ActiveRecord::RecordNotFound
        render json: { errors: ["WorkSession not found"] }, status: :not_found
      end

      private

      def find_user_work_session!(id)
        WorkSession.joins(organization: :users)
                   .where(users: { id: current_user.id })
                   .find(id)
      end

      def pagination_params
        per_page = (params[:per_page] || 100).to_i
        per_page = 100 if per_page <= 0
        per_page = [per_page, 1000].min
        page = (params[:page] || 1).to_i
        [page, per_page]
      end

      def build_assessments(work_session, page, per_page)
        direction = order_direction
        RiskAssessment.joins(:safety_log)
                      .where(safety_logs: { work_session_id: work_session.id })
                      .includes(:safety_log)
                      .order("safety_logs.logged_at #{direction}")
                      .page(page)
                      .per(per_page)
      end

      def order_direction
        raw = params[:order].to_s.downcase
        return "DESC" if raw == "desc"

        "ASC"
      end

      def add_pagination_headers(assessments)
        response.set_header("X-Total-Count", assessments.total_count.to_s)
        response.set_header("X-Total-Pages", assessments.total_pages.to_s)
        response.set_header("X-Per-Page", assessments.limit_value.to_s)
        response.set_header("X-Current-Page", assessments.current_page.to_s)
      end
    end
  end
end
