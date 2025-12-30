class ChangeAlertTypeToInteger < ActiveRecord::Migration[7.2]
  def up
    execute <<-SQL.squish
      ALTER TABLE alerts
      ADD COLUMN alert_type_tmp integer DEFAULT 0 NOT NULL;
    SQL

    execute <<-SQL.squish
      UPDATE alerts SET alert_type_tmp =
        CASE alert_type
          WHEN 'sos' THEN 0
          WHEN 'risk_high' THEN 1
          WHEN 'risk_medium' THEN 2
          WHEN 'battery_low' THEN 3
          WHEN 'timeout' THEN 4
          ELSE 0
        END
    SQL

    rename_column :alerts, :alert_type, :alert_type_old
    rename_column :alerts, :alert_type_tmp, :alert_type
    remove_column :alerts, :alert_type_old
  end

  def down
    add_column :alerts, :alert_type_old, :string
    execute <<-SQL.squish
      UPDATE alerts SET alert_type_old =
        CASE alert_type
          WHEN 0 THEN 'sos'
          WHEN 1 THEN 'risk_high'
          WHEN 2 THEN 'risk_medium'
          WHEN 3 THEN 'battery_low'
          WHEN 4 THEN 'timeout'
          ELSE 'timeout'
        END
    SQL
    remove_column :alerts, :alert_type
    rename_column :alerts, :alert_type_old, :alert_type
  end
end
