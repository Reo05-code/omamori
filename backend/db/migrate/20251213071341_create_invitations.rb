class CreateInvitations < ActiveRecord::Migration[7.2]
  def change
    create_table :invitations do |t|
      # 招待発行者（usersテーブルを参照）
      t.references :inviter, null: false, foreign_key: { to_table: :users }, type: :bigint

      # 招待先メールアドレス
      t.string :invited_email, null: false

      # 招待トークン（UUID）
      t.string :token, null: false

      # 付与されるロール
      t.integer :role, null: false, comment: "付与されるロール（worker/admin）"

      # 有効期限と受諾日時
      t.datetime :expires_at
      t.datetime :accepted_at

      t.timestamps
    end

    # token の一意制約は DB レベルでも保証する
    add_index :invitations, :token, unique: true
  end
end
