# frozen_string_literal: true

FactoryBot.define do
  factory :invitation do
    inviter factory: %i[user]
    organization
    sequence(:invited_email) { |n| "invitee#{n}@example.com" }
    role { :worker }
  end
end
