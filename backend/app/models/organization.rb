class Organization < ApplicationRecord
  has_many :memberships, dependent: :destroy
  has_many :users, through: :memberships
  has_many :invitations, dependent: :destroy
  has_many :work_sessions, dependent: :destroy

  validates :name, presence: true, length: { maximum: 100 }
end
