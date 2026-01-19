# frozen_string_literal: true

# Organization に対する操作の許可判定を担うポリシークラス
class OrganizationPolicy
  Result = Struct.new(:allowed?, :error_key)

  def initialize(user, organization)
    @user = user
    @organization = organization
  end

  # 組織情報の更新可否を判定する
  # 管理者のみ許可
  def update
    return Result.new(false, :forbidden) unless user_is_admin?

    Result.new(true, nil)
  end

  private

  attr_reader :user, :organization

  # ユーザーがその組織の管理者かどうか
  def user_is_admin?
    membership = organization.memberships.find_by(user: user)
    membership&.admin?
  end
end
