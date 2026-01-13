# frozen_string_literal: true

module Api
  module V1
    module Organizations
      class AlertsController < ApplicationController
        DEFAULT_LIMIT = 20
        MAX_LIMIT = 100
        MIN_LIMIT = 1

        before_action :authenticate_user!
        before_action :set_organization
        before_action :set_current_membership
        before_action :require_admin!
        before_action :set_alert, only: [:update]

        # GET /api/v1/organizations/:organization_id/alerts
        def index
          alerts = base_alerts_scope
          alerts = apply_status_filter(alerts)
          alerts = apply_urgent_filter(alerts)

          alerts = alerts.order_by_priority.limit(parsed_limit)

          render json: alerts, each_serializer: Api::V1::OrganizationAlertSerializer, status: :ok
        end

        # PATCH /api/v1/organizations/:organization_id/alerts/:id
        def update
          @alert.with_lock { update_alert_with_lock }
        end

        # GET /api/v1/organizations/:organization_id/alerts/summary
        # ダッシュボード用: 組織のアラート件数と内訳を集計して返す
        def summary
          render json: AlertSummaryBuilder.new(@organization).call, status: :ok
        end

        private

        def update_alert_with_lock
          update_params = alert_update_params

          apply_resolution_fields_if_needed(update_params)

          update_and_render(update_params)
        rescue ArgumentError => e
          render json: { errors: [e.message] }, status: :unprocessable_content
        end

        def apply_resolution_fields_if_needed(update_params)
          return unless update_params[:status]&.to_sym == :resolved

          update_params[:handled_by_user_id] = current_user.id
          update_params[:resolved_at] = Time.current
        end

        def update_and_render(update_params)
          if @alert.update(update_params)
            render json: @alert, status: :ok
          else
            render json: { errors: @alert.errors.full_messages }, status: :unprocessable_content
          end
        end

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

        def base_alerts_scope
          Alert.joins(:work_session)
               .where(work_sessions: { organization_id: @organization.id })
               .includes(work_session: :user)
        end

        # リクエストを整形して安全なSQLにする
        def apply_status_filter(scope)
          raw = params[:status].to_s
          return scope if raw.blank?

          requested = raw.split(",").map(&:strip).compact_blank.uniq
          valid_statuses = requested & Alert.statuses.keys

          valid_statuses.any? ? scope.where(status: valid_statuses) : scope
        end

        # 緊急・非緊急の切り替え
        def apply_urgent_filter(scope)
          return scope unless params.key?(:urgent)

          raw = params[:urgent]
          return scope if raw.is_a?(String) && raw.strip == ""

          urgent_value = ActiveModel::Type::Boolean.new.cast(raw)
          urgent_value ? scope.urgent : scope.not_urgent
        end

        # 件数制限
        def parsed_limit
          raw = params[:limit]
          return DEFAULT_LIMIT if raw.nil?

          limit = Integer(raw)
          limit.clamp(MIN_LIMIT, MAX_LIMIT)
        rescue ArgumentError, TypeError
          DEFAULT_LIMIT
        end
      end
    end
  end
end
