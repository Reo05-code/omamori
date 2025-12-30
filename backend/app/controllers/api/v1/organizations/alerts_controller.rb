# frozen_string_literal: true

module Api
  module V1
    module Organizations
      class AlertsController < ApplicationController
        before_action :authenticate_user!
        before_action :set_organization
        before_action :set_alert, only: [:update]

        # GET /api/v1/organizations/:organization_id/alerts
        def index
          alerts = Alert.joins(:work_session)
                .where(work_sessions: { organization_id: @organization.id })
                .includes(work_session: :user)
                .order_by_priority

          render json: alerts
        end

        # PATCH /api/v1/organizations/:organization_id/alerts/:id
        def update
          @alert.with_lock do
            update_params = alert_update_params

            # statusがresolvedになる場合、handled_by_userとresolved_atをセット
            if update_params[:status]&.to_sym == :resolved
              update_params[:handled_by_user_id] = current_user.id
              update_params[:resolved_at] = Time.current
            end

            if @alert.update(update_params)
              render json: @alert, status: :ok
            else
              render json: { errors: @alert.errors.full_messages }, status: :unprocessable_entity
            end
          end
        end

        private

        def set_organization
          @organization = current_user.organizations.find(params[:organization_id])
        rescue ActiveRecord::RecordNotFound
          render json: { error: "Organization not found" }, status: :not_found
        end

        def set_alert
          # organization配下のwork_sessions経由でalertを検索
          @alert = Alert.joins(work_session: :organization)
                        .where(work_sessions: { organization_id: @organization.id })
                        .find(params[:id])
        rescue ActiveRecord::RecordNotFound
          render json: { error: "Alert not found" }, status: :not_found
        end

        def alert_update_params
          params.require(:alert).permit(:status)
        end
      end
    end
  end
end
