class Membership < ApplicationRecord
  belongs_to :organization
  belongs_to :user

  enum :role, { worker: 0, admin: 1 }

  # 同じ organization の中では、同じ user は1回しか登場できない
  validates :user_id, uniqueness: { scope: :organization_id }
  validates :role, presence: true
end
