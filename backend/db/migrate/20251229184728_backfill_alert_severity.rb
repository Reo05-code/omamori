class BackfillAlertSeverity < ActiveRecord::Migration[7.2]
  def up
    # sos と risk_high は critical (3)
    Alert.where(alert_type: ['sos', 'risk_high']).update_all(severity: 3)

    # risk_medium は medium (1)
    Alert.where(alert_type: 'risk_medium').update_all(severity: 1)

    # その他（timeout, battery_low等）は low (0) - すでにdefaultが0なのでスキップ可能
  end

  def down
    # Rollback時は全てのseverityを0に戻す
    Alert.update_all(severity: 0)
  end
end
