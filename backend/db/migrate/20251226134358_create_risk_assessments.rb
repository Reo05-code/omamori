class CreateRiskAssessments < ActiveRecord::Migration[7.2]
  def change
    create_table :risk_assessments do |t|
      t.references :safety_log, null: false, foreign_key: true, index: { unique: true }
      t.integer :score, null: false, default: 0
      t.integer :level, null: false, default: 0
      t.jsonb :details, null: false, default: {}

      t.timestamps
    end
  end
end
