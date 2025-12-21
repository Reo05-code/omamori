class CreateWorkSessions < ActiveRecord::Migration[7.2]
  def change
    create_table :work_sessions do |t|
      t.references :user, null: false, foreign_key: true, index: true
      t.references :organization, null: false, foreign_key: true, index: true
      t.datetime :started_at, null: false
      t.datetime :ended_at
      t.integer :status, null: false, default: 0

      t.timestamps
    end

    add_index :work_sessions, :started_at
  end
end
