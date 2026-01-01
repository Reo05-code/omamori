# frozen_string_literal: true

class WorkSessionPolicy
  # WorkSession に対する操作の許可判定を行うポリシークラス
  #
  # 内容:
  # - コントローラ側はこのポリシーの結果 (`Result`) を参照して
  #   HTTP レスポンスを 403/404 に振り分けします（許可されなければ隠蔽目的で 404 を返す等）。
  # - `work_session` は未保存オブジェクト（create 時）や DB のレコード（show/finish 等）
  #   いずれも渡されるため、target_user の存在や所属組織を確認します。
  # - 管理者判定は `organization.memberships(role: :admin)` を使います。
  Result = Struct.new(:allowed?, :error_key)

  def initialize(user, work_session)
    @user = user
    @work_session = work_session
    @organization = work_session.organization
  end

  # create の可否を判定する
  # - WorkSession（未保存）から target_user / organization を取り出して判定する
  def create
    # create の判定は未保存の WorkSession を元に行う
    # - target_user が不在 or 組織が不明なら禁止
    # - 自分自身のセッション作成は許可
    # - それ以外は組織内の admin のみが代理で作成可能（組織外なら :not_found を返す）
    target_user = work_session.user
    return Result.new(false, :forbidden) if target_user.blank? || organization.blank?

    return Result.new(true, nil) if user_own?(target_user)

    evaluate_admin_create(target_user)
  end

  def finish
    # 終了は本人が行える。本人でなければ同一組織の admin のみ許可。
    return Result.new(true, nil) if work_session.user_id == user.id
    return Result.new(false, :not_found) unless actor_is_admin?

    Result.new(true, nil)
  end

  def cancel
    finish
  end

  def show
    # 詳細閲覧は本人、または同一組織の admin に限定
    return Result.new(true, nil) if work_session.user_id == user.id
    return Result.new(false, :not_found) unless actor_is_admin?

    Result.new(true, nil)
  end

  private

  attr_reader :user, :work_session, :organization

  def actor_is_admin?
    organization.memberships.exists?(user_id: user.id, role: :admin)
  end

  def user_own?(target_user)
    user.id == target_user.id
  end

  def evaluate_admin_create(target_user)
    return Result.new(false, :forbidden) unless actor_is_admin?
    return Result.new(false, :not_found) unless organization.users.exists?(id: target_user.id)

    Result.new(true, nil)
  end
end
