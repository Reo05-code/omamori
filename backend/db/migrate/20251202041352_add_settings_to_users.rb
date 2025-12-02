class AddSettingsToUsers < ActiveRecord::Migration[7.2]
  def change
    # default: {} と null: false を必ずつける
    add_column :users, :settings, :jsonb, default: {}, null: false
  end
end
