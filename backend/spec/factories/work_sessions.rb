# frozen_string_literal: true

FactoryBot.define do
  factory :work_session do
    user
    organization
    started_at { Time.current }
    ended_at { nil }
    status { :in_progress }
  end
end
