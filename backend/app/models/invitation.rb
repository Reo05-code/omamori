# frozen_string_literal: true

# Invitation model
# - 招待を表現するモデル
# - 招待は inviter (User, admin) が発行し、email, role, token, 有効期限を持つ
# Invitation は inviter_id を通して User（admin）を参照する
class Invitation < ApplicationRecord
  # 招待者（Userモデルの admin）への関連
  belongs_to :inviter, class_name: "User", inverse_of: :sent_invitations

  # オプショナルに組織を紐づける
  belongs_to :organization, optional: true

  enum :role, { worker: 0, admin: 1 }

  # トークンを作成（UUID）
  before_validation :ensure_token

  # バリデーション
  validate :inviter_must_be_admin
  validates :invited_email, presence: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :token, presence: true, uniqueness: true
  validates :role, presence: true

  # 未承諾かつ有効期限内の招待のみを返すスコープ
  scope :pending, lambda {
    where(accepted_at: nil)
      # まだ承諾されていなくて、期限が設定されていないか、まだ期限内の招待
      .where("expires_at IS NULL OR expires_at > ?", Time.current)
  }

  private

  # role は画面制御用だが、Invitation 発行権限の条件として admin を要求する
  def inviter_must_be_admin
    errors.add(:inviter, "must be admin") unless inviter&.admin?
  end

  # token をセット（未設定の場合）
  def ensure_token
    self.token ||= SecureRandom.uuid
  end
end
