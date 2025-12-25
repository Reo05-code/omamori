class CreateSafetyLogs < ActiveRecord::Migration[7.2]
  def change
    create_table :safety_logs do |t|
      t.references :work_session, null: false, foreign_key: true, index: false
      t.datetime :logged_at, null: false
      t.integer :battery_level, null: false
      t.integer :trigger_type, null: false, default: 0
      t.boolean :is_offline_sync, null: false, default: false
      t.float :gps_accuracy
      t.float :weather_temp
      t.string :weather_condition

      t.timestamps
    end

    # geography 型を SQL で直接追加 （ActiveRecord の抽象化では対応できないため）
    execute <<-SQL
      ALTER TABLE safety_logs
      ADD COLUMN lonlat geography(Point, 4326) NOT NULL;

      COMMENT ON COLUMN safety_logs.trigger_type IS '0=heartbeat, 1=sos, 2=check_in';
    SQL

    # GIST インデックス（空間検索用）
    add_index :safety_logs, :lonlat, using: :gist

    # BTREE 複合インデックス（セッションごとの時系列取得用）
    add_index :safety_logs, [:work_session_id, :logged_at], order: { logged_at: :desc }

    # データの整合性を守る制約
    add_check_constraint :safety_logs, "battery_level BETWEEN 0 AND 100", name: "battery_level_range"
  end
end
