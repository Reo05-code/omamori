# frozen_string_literal: true

FactoryBot.define do
  factory :safety_log do
    work_session
    logged_at { Time.current }
    latitude { Faker::Address.latitude.to_f }
    longitude { Faker::Address.longitude.to_f }
    battery_level { rand(20..100) }
    trigger_type { :heartbeat }
    is_offline_sync { false }
    gps_accuracy { rand(5.0..30.0).round(2) }
    weather_temp { rand(0.0..35.0).round(1) }
    weather_condition { %w[sunny cloudy rainy snowy].sample }

    trait :sos do
      trigger_type { :sos }
      battery_level { rand(5..30) }
    end

    trait :check_in do
      trigger_type { :check_in }
    end

    trait :low_battery do
      battery_level { rand(0..10) }
    end

    trait :high_accuracy do
      gps_accuracy { rand(1.0..10.0).round(2) }
    end

    trait :offline_synced do
      is_offline_sync { true }
    end
  end
end
