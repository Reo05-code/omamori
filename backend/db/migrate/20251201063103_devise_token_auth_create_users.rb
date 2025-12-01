class DeviseTokenAuthCreateUsers < ActiveRecord::Migration[7.0]
  def change
    create_table(:users) do |t|
      ## Required (DeviseTokenAuthの必須カラム：絶対消さない！)
      t.string :provider, :null => false, :default => "email"
      t.string :uid, :null => false, :default => ""

      ## Database authenticatable (Devise標準)
      t.string :encrypted_password, :null => false, :default => ""

      ## Recoverable (パスワードリセット)
      t.string   :reset_password_token
      t.datetime :reset_password_sent_at
      t.boolean  :allow_password_change, :default => false

      ## Rememberable (ログイン保持)
      t.datetime :remember_created_at

      ## Confirmable (メール確認機能)
      # 今回は面倒なのでコメントアウト推奨。あとで必要なら解除してdb:migrateし直せばOK
      # t.string   :confirmation_token
      # t.datetime :confirmed_at
      # t.datetime :confirmation_sent_at
      # t.string   :unconfirmed_email # Only if using reconfirmable

      ## User Info (あなたの追加したいカラム)
      t.string :name
      t.string :phone_number
      t.string :avatar_url # devise_token_auth標準では :image という名前ですが、avatar_urlでもOK
      t.string :email

      # 【重要】roleを追加。default: 0 を忘れずに
      t.integer :role, default: 0, null: false

      ## Tokens (これがないとログイン状態を維持できない：絶対消さない！)
      t.json :tokens # PostgreSQLなら :json または :jsonb

      t.timestamps
    end

    add_index :users, :email,                unique: true
    add_index :users, [:uid, :provider],     unique: true
    add_index :users, :reset_password_token, unique: true
    # add_index :users, :confirmation_token,   unique: true
  end
end
