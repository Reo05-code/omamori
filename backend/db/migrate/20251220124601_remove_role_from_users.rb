# frozen_string_literal: true

class RemoveRoleFromUsers < ActiveRecord::Migration[7.0]
  def change
    remove_column :users, :role, :integer, default: 0, null: false
  end
end
