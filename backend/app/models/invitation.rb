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

  validates :organization, presence: true

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

  # 招待を受諾するビジネスロジックをモデルへ集約する
  # 引数: user (User) — accept を行う認証済みユーザー
  # 戻り値: Result = Struct.new(:success, :error_key, :membership)
  Result = Struct.new(:success, :error_key, :membership)

  def accept_by(user)
    return Result.new(false, :organization_missing, nil) if organization.nil?

    # pending であることを再確認（controller が pending スコープで取得する前提だが二重チェック）
    unless accepted_at.nil? && (expires_at.nil? || expires_at > Time.current)
      return Result.new(false, :invalid_token, nil)
    end

    if invited_email.present? && user.email.to_s.downcase != invited_email.to_s.downcase
      return Result.new(false, :email_mismatch, nil)
    end

    if organization.memberships.exists?(user: user)
      return Result.new(false, :already_member, nil)
    end

    membership = nil
    begin
      ActiveRecord::Base.transaction do
        membership = organization.memberships.create!(user: user, role: role)
        update!(accepted_at: Time.current)
      end
    rescue ActiveRecord::RecordInvalid
      return Result.new(false, :invalid_membership, nil)
    rescue ActiveRecord::RecordNotUnique
      return Result.new(false, :already_member, nil)
    end

    Result.new(true, nil, membership)
  end

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
