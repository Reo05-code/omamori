# frozen_string_literal: true

# spec/factories/users.rb
FactoryBot.define do
  factory :user do
    # 50文字上限に合わせた名前
    name { Faker::Name.name.first(50) }

    # 重複不可な email 用
    sequence(:email) { |n| "user#{n}@example.com" }

    # Devise 用の基本パスワード
    password { "password123" }
    password_confirmation { "password123" }

    # enum :admin を基本値として設定
    role { :admin }

    # DB 制約に合わせてユニーク番号を生成
    sequence(:phone_number) { |n| format("090%08d", n) }

    # 管理者ユーザー用
    trait :admin do
      role { :admin }
    end

    # アバター付きユーザー用
    trait :with_avatar do
      avatar_url do
        Faker::Internet.url(
          host: "example.com",
          path: "/avatars/#{SecureRandom.hex(8)}.jpg",
          scheme: "https"
        )
      end
    end
  end
end
