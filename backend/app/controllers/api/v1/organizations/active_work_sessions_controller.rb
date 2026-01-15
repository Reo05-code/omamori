# frozen_string_literal: true

module Api
  module V1
    module Organizations
      class ActiveWorkSessionsController < ApplicationController
        before_action :authenticate_user!
        before_action :set_organization
        before_action :set_current_membership
        before_action :require_admin!

        # GET /api/v1/organizations/:organization_id/active_work_sessions/latest_locations
        def latest_locations
          locations = fetch_latest_locations
          render json: locations, status: :ok
        end

        private

        def set_organization
          @organization = current_user.organizations.find(params[:organization_id])
        rescue ActiveRecord::RecordNotFound
          render json: { error: I18n.t("api.v1.organizations.not_found") }, status: :not_found
        end

        def set_current_membership
          @current_membership = @organization.memberships.find_by(user: current_user)
        end

        def require_admin!
          return if @current_membership&.admin?

          render json: { error: I18n.t("api.v1.organizations.error.forbidden") }, status: :forbidden
        end

        def fetch_latest_locations
          # サブクエリで最新の safety_log.id を取得
          latest_log_ids = SafetyLog
                           .joins(work_session: :organization)
                           .where(work_sessions: { organization_id: @organization.id, status: :in_progress })
                           .where.not(lonlat: nil)
                           .select("DISTINCT ON (safety_logs.work_session_id) safety_logs.id")
                           .order("safety_logs.work_session_id, safety_logs.logged_at DESC")

          # 取得した ID で safety_logs を再取得し、user を includes
          logs = SafetyLog
                 .where(id: latest_log_ids)
                 .includes(work_session: :user)

          logs.map { |log| serialize_location(log) }
        end

        def serialize_location(log)
          {
            work_session_id: log.work_session_id,
            user_id: log.work_session.user_id,
            user_name: log.work_session.user.name,
            latitude: log.latitude,
            longitude: log.longitude,
            logged_at: log.logged_at.iso8601
          }
        end
      end
    end
  end
end
