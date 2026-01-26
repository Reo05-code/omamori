# frozen_string_literal: true

module WeatherHelper
  CONDITION_LABELS = {
    clear: "晴れ",
    partly_cloudy: "晴れ時々曇り",
    cloudy: "曇り",
    overcast: "曇り",
    foggy: "霧",
    drizzle: "霧雨",
    rainy: "雨",
    freezing_rain: "凍雨",
    snowy: "雪",
    snow_grains: "雪",
    rain_showers: "にわか雨",
    snow_showers: "にわか雪",
    thunderstorm: "雷雨",
    unknown: "不明"
  }.freeze

  def weather_condition_label(condition)
    CONDITION_LABELS[condition&.to_sym] || "不明"
  end
end
