# frozen_string_literal: true

# Invitation model
# - 招待を表現するモデル
# - 招待は inviter (User, admin) が発行し、email, role, token, 有効期限を持つ
# Invitation は inviter_id を通して User（admin）を参照する
class Invitation < ApplicationRecord
  # 招待者（Userモデルの admin）への関連
  belongs_to :inviter, class_name: "User", inverse_of: :sent_invitations

  # Invitation は必ず組織に属する
  belongs_to :organization

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

  # 招待を受諾するビジネスロジック
  Result = Struct.new(:success, :error_key, :membership, :errors)

  # インスタンスが現在 pending（未承諾かつ期限内）かどうかを判定
  def pending?
    accepted_at.nil? && (expires_at.nil? || expires_at > Time.current)
  end

  # pending な招待を承認する処理
  def accept_by(user)
    # pending でなければ拒否
    return Result.new(false, :invalid_token, nil, []) unless pending?

    check_email_mismatch(user) || check_already_member(user) || begin
      membership = nil
      begin
        membership = create_membership_for(user)
      rescue ActiveRecord::RecordInvalid => e
        # 例外を Result に変換して返す（設計を Result ベースに統一）
        return Result.new(false, :validation_errors, nil, e.record.errors.full_messages)
      rescue ActiveRecord::RecordNotUnique
        return Result.new(false, :already_member, nil, [])
      end

      Result.new(true, nil, membership, [])
    end
  end

  def create_membership_for(user)
    ActiveRecord::Base.transaction do
      membership = organization.memberships.create!(user: user, role: role)
      update!(accepted_at: Time.current)
      membership
    end
  end

  def check_email_mismatch(user)
    if invited_email.present? && user.email.to_s.downcase != invited_email.to_s.downcase
      return Result.new(false, :email_mismatch, nil, [])
    end

    nil
  end

  def check_already_member(user)
    return Result.new(false, :already_member, nil, []) if organization.memberships.exists?(user: user)

    nil
  end

  private

  # role は画面制御用だが、Invitation 発行権限の条件として admin を要求する
  def inviter_must_be_admin
    membership = organization&.memberships&.find_by(user: inviter)
    errors.add(:inviter, "must be admin") unless membership&.admin?
  end

  # token をセット（未設定の場合）
  def ensure_token
    self.token ||= SecureRandom.uuid
  end
end
