class CreateAlerts < ActiveRecord::Migration[7.2]
  def change

    create_table :alerts, id: :bigint do |t|
      t.references :work_session, null: false, foreign_key: true, type: :bigint
      t.references :safety_log, null: true, foreign_key: true, type: :bigint
      t.references :handled_by_user, null: true, foreign_key: { to_table: :users }, type: :bigint
      t.string :alert_type, null: false
      t.integer :status, null: false, default: 0
      t.datetime :resolved_at
      t.timestamps
    end

    add_index :alerts, :alert_type
    # 「未対応」のアラートだけを瞬時に抜き出す
    add_index :alerts, :status
    # 最新順に並び替える
    add_index :alerts, :created_at

  end
end
