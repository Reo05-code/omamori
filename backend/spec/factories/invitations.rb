# frozen_string_literal: true

FactoryBot.define do
  factory :invitation do
    association :inviter, factory: :user
    organization
    sequence(:invited_email) { |n| "invitee#{n}@example.com" }
    role { :worker }
  end
end
