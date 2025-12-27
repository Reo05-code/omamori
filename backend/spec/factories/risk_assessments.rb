# frozen_string_literal: true

FactoryBot.define do
  factory :risk_assessment do
    safety_log
    score { 0 }
    level { :safe }
    details do
      {
        reasons: [],
        factors: {}
      }
    end

    trait :safe do
      score { 0 }
      level { :safe }
      details do
        {
          reasons: [],
          factors: {}
        }
      end
    end

    trait :caution do
      score { 50 }
      level { :caution }
      details do
        {
          reasons: %w[low_battery high_temperature],
          factors: {
            "battery_score" => 20,
            "temp_score" => 30
          }
        }
      end
    end

    trait :danger do
      score { 100 }
      level { :danger }
      details do
        {
          reasons: %w[sos_trigger low_battery],
          factors: {
            "sos_score" => 80,
            "battery_score" => 20
          }
        }
      end
    end

    trait :high_temperature do
      score { 40 }
      level { :caution }
      details do
        {
          reasons: %w[high_temperature],
          factors: {
            "temp_score" => 40
          }
        }
      end
    end

    trait :low_battery do
      score { 30 }
      level { :caution }
      details do
        {
          reasons: %w[low_battery],
          factors: {
            "battery_score" => 30
          }
        }
      end
    end

    trait :long_inactive do
      score { 25 }
      level { :caution }
      details do
        {
          reasons: %w[long_inactive],
          factors: {
            "movement_score" => 25
          }
        }
      end
    end

    trait :poor_gps_accuracy do
      score { 15 }
      level { :caution }
      details do
        {
          reasons: %w[poor_gps_accuracy],
          factors: {
            "gps_score" => 15
          }
        }
      end
    end
  end
end
