# frozen_string_literal: true

# 組織のアラート集計を行う
# ダッシュボードで表示する件数と内訳を生成する
class AlertSummaryBuilder
  def initialize(organization)
    @organization = organization
  end

  def call
    {
      counts: build_counts,
      breakdown: build_breakdown
    }
  end

  private

  attr_reader :organization

  def alerts_scope
    @alerts_scope ||= Alert.joins(:work_session)
                           .where(work_sessions: { organization_id: organization.id })
  end

  def build_counts
    {
      unresolved: alerts_scope.unresolved.count,
      open: alerts_scope.where(status: :open).count,
      in_progress: alerts_scope.where(status: :in_progress).count,
      urgent_open: alerts_scope.urgent.where(status: %i[open in_progress]).count
    }
  end

  def build_breakdown
    {
      urgent: {
        sos_open: alerts_scope.where(status: :open, alert_type: :sos).count,
        critical_open_non_sos: alerts_scope.where(status: :open, severity: :critical)
                                           .where.not(alert_type: :sos).count
      }
    }
  end
end
