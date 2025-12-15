# frozen_string_literal: true

FactoryBot.define do
  factory :membership do
    organization
    user
    role { :worker }
  end
end
