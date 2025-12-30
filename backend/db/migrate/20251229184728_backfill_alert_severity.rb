class BackfillAlertSeverity < ActiveRecord::Migration[7.2]
  def up
    # 1. SOS (0) は Critical (3) へ
    Alert.where(alert_type: 0).update_all(severity: 3)

    # 2. Risk High (1) は High (2) へ 
    Alert.where(alert_type: 1).update_all(severity: 2)

    # 3. Risk Medium (2) は Medium (1) へ
    Alert.where(alert_type: 2).update_all(severity: 1)

    # 4. その他 (battery_low等) はデフォルトで Low (0) なのでそのままでOK
  end

  def down
    # Rollback時は全て0に戻す
    Alert.update_all(severity: 0)
  end
end
