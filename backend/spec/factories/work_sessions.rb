# frozen_string_literal: true

FactoryBot.define do
  factory :work_session do
    association :user
    association :organization
    started_at { Time.current }
    ended_at { nil }
    status { :in_progress }
  end
end
