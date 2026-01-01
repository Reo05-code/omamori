class AddCreatedByUserIdToWorkSessions < ActiveRecord::Migration[7.2]
  def change
    add_column :work_sessions, :created_by_user_id, :bigint

    add_index :work_sessions, :created_by_user_id
    add_foreign_key :work_sessions, :users, column: :created_by_user_id
  end
end
