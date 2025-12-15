class MembershipPolicy
  # Membership に対する操作の許可判定を担うポリシークラス
  Result = Struct.new(:allowed?, :error_key)

  def initialize(user, membership, actor_membership = nil)
    @user = user
    @membership = membership
    @organization = membership.organization
    @actor_membership = actor_membership
  end

  # role 変更の可否を判定する
  # 前提条件（管理者）→ 業務ルール（自己降格 / 最後の管理者） の順でチェックする
  def update(new_role = nil)
    norm = Membership.normalize_role(new_role)

    return Result.new(false, :forbidden) unless actor_is_admin?
    return Result.new(false, :cannot_demote_self) if demote_self?(norm)
    return Result.new(false, :last_admin) if demote_last_admin?(norm)

    Result.new(true, nil)
  end

  # 削除の判定 — 理由付き結果を返す
  def destroy
    return Result.new(false, :forbidden) unless actor_is_admin?
    return Result.new(false, :last_admin) if last_admin_deletion?

    Result.new(true, nil)
  end

  private

  attr_reader :user, :membership, :organization, :actor_membership

  # 指定された actor がその組織の管理者かどうか
  def actor_is_admin?
    org_membership = actor_membership || organization.memberships.find_by(user: user)
    org_membership&.admin?
  end

  # 自分自身を管理者から降格するか（禁止）
  def demote_self?(new_role)
    membership.user_id == user.id && new_role.present? && new_role != "admin"
  end

  # 更新で最後の admin がいなくなってしまうか（禁止）
  def demote_last_admin?(new_role)
    return false unless membership.role == "admin" && new_role.present? && new_role != "admin"

    # 自分以外に admin が存在するかを確認する。存在しなければ最後の admin となる。
    !organization.memberships.where(role: :admin).where.not(id: membership.id).exists?
  end

  # 削除で最後の admin がいなくなるか（禁止）
  def last_admin_deletion?
    return false unless membership.role == "admin"

    # 削除時に自分以外に admin が存在しない場合は最後の admin 削除に当たる
    !organization.memberships.where(role: :admin).where.not(id: membership.id).exists?
  end
end
