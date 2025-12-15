class Membership < ApplicationRecord
  belongs_to :organization
  belongs_to :user

  enum :role, { worker: 0, admin: 1 }

  # 同じ organization の中では、同じ user は1回しか登場できない
  validates :user_id, uniqueness: { scope: :organization_id }
  validates :role, presence: true

  # 外部から渡される role 値（数値・文字列）の正規化を集中管理します。
  # - 数値インデックス、数値文字列は enum のキーに変換。
  # - 空文字列や不正な数値は nil を返し、呼び出し元でバリデーションできます。
  def self.normalize_role(value)
    return nil if value.nil?

    s = value.to_s
    return nil if s.empty?

    if s =~ /^\d+$/
      key = roles.key(s.to_i)
      key&.to_s
    else
      s
    end
  end
end
