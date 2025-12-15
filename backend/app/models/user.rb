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

  # Roleの定義(将来的に削除予定)
  enum :role, { worker: 0, admin: 1 }

  has_many :memberships, dependent: :destroy
  has_many :organizations, through: :memberships
  # ユーザが発行した招待
  # - inviter_id を使って Invitation を参照する
  has_many :sent_invitations, class_name: "Invitation", foreign_key: "inviter_id", inverse_of: :inviter,
                              dependent: :destroy

  # store_accessor は JSON カラムに保存されているキーを「モデルの普通の属性」として扱える機能
  # 例: user.notification_enabled, user.dark_mode
  store_accessor :settings, :notification_enabled, :dark_mode

  # バリデーション
  # API 経由で名前が必須だと登録失敗になるため、名前は任意にします。
  validates :name, allow_blank: true, length: { maximum: 50 }
  validates :role, presence: true, inclusion: { in: roles.keys }
  # フロントエンド側では電話番号は任意扱いのため、空白は許容する
  validates :phone_number, allow_blank: true, format: { with: /\A\d{10,11}\z/, message: "は10〜11桁の数字で入力してください" }
  validates :avatar_url, allow_blank: true, format: { with: URI::DEFAULT_PARSER.make_regexp(%w[http https]) }
  validates :notification_enabled, inclusion: { in: [true, false], allow_nil: true }
  validates :dark_mode, inclusion: { in: %w[on off], allow_nil: true }

  # 新規登録時にロールのデフォルト値を設定
  before_validation :set_default_role, on: :create

  private

  def set_default_role
    # enum を利用しているのでシンボルで割り当てる（または整数を使う）
    self.role ||= :worker
  end
end
