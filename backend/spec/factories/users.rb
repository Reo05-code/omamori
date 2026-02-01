# frozen_string_literal: true

# spec/factories/users.rb
FactoryBot.define do
  factory :user do
    # 50文字上限に合わせた名前
    name { Faker::Name.name.first(50) }

    # 重複不可な email 用
    sequence(:email) { |n| "user#{n}@example.com" }

    # パスワード強度要件を満たすパスワード（8文字以上 + 大文字・小文字・数字）
    password { "Password123" }
    password_confirmation { "Password123" }

    # DB 制約に合わせてユニーク番号を生成
    sequence(:phone_number) { |n| format("090%08d", n) }

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
