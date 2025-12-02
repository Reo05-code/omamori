# frozen_string_literal: true

# ActiveRecord::Base から変更
class User < ApplicationRecord
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable

  # API トークンベースの認証を扱うためのモジュール
  # モバイルアプリや SPA との連携で使う
  include DeviseTokenAuth::Concerns::User

  # Roleの定義 (0: worker, 1: admin)
  enum :role, { worker: 0, admin: 1 }

  # store_accessor は JSON カラムに保存されているキーを「モデルの普通の属性」として扱える機能
  # 例: user.notification_enabled, user.dark_mode
  store_accessor :settings, :notification_enabled, :dark_mode

  # バリデーション
  validates :name, presence: true, length: { maximum: 50 }
  validates :role, presence: true, inclusion: { in: roles.keys }
  validates :phone_number, presence: true, format: { with: /\A\d{10,11}\z/, message: "は10〜11桁の数字で入力してください" }
  validates :avatar_url, allow_blank: true, format: { with: URI::DEFAULT_PARSER.make_regexp(%w[http https]) }
  validates :notification_enabled, inclusion: { in: [true, false], allow_nil: true }
  validates :dark_mode, inclusion: { in: %w[on off], allow_nil: true }

  # 3. email
  # Devise の validatable により自動で presence と format と uniqueness のバリデーションが入るので不要。

  # 4. encrypted_password
  # Devise が管理するので自前でバリデーション不要。
end
