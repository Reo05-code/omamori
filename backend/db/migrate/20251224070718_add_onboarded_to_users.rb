class AddOnboardedToUsers < ActiveRecord::Migration[7.2]
  def change
    add_column :users, :onboarded, :boolean, default: false, null: false
    add_index :users, :onboarded
  end
end
