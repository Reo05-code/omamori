FactoryBot.define do
  factory :alert do
    work_session
    # デフォルトではログと担当者は nil (optionalのため)
    safety_log { nil }
    handled_by_user { nil }

    alert_type { "sos" }
    status { :open }
    resolved_at { nil }

    # ログ付きを作りたいときは create(:alert, :with_log) と書ける
    trait :with_log do
      safety_log
    end

    # 解決済みを作りたいときは create(:alert, :resolved) と書ける
    trait :resolved do
      status { :resolved }
      resolved_at { Time.current }
      handled_by_user factory: %i[user]
    end
  end
end
