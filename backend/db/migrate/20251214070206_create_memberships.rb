class CreateMemberships < ActiveRecord::Migration[7.2]
  def change
    create_table :memberships do |t|
      t.references :organization, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.integer :role, null: false, default: 0, comment: "0=worker, 1=admin"
      t.timestamps
    end

    add_index :memberships, [:user_id, :organization_id], unique: true
  end
end
