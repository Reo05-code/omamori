class AddSeverityToAlerts < ActiveRecord::Migration[7.2]
  def change
    add_column :alerts, :severity, :integer, default: 0, null: false
    add_index :alerts, :severity
  end
end
