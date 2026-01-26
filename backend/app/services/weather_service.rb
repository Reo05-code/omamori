class WeatherService
  TIMEOUT = 1.2
  CACHE_DURATION = 10.minutes
  API_URL = "https://api.open-meteo.com/v1/forecast".freeze
  CURRENT_PARAMS = "temperature_2m,weather_code".freeze

  # WMO Weather Code mapping to symbols
  WEATHER_CODE_MAP = {
    0 => :clear,
    1 => :partly_cloudy,
    2 => :cloudy,
    3 => :overcast,
    45 => :foggy,
    48 => :foggy,
    51 => :drizzle,
    53 => :drizzle,
    55 => :drizzle,
    61 => :rainy,
    63 => :rainy,
    65 => :rainy,
    66 => :freezing_rain,
    67 => :freezing_rain,
    71 => :snowy,
    73 => :snowy,
    75 => :snowy,
    77 => :snow_grains,
    80 => :rain_showers,
    81 => :rain_showers,
    82 => :rain_showers,
    85 => :snow_showers,
    86 => :snow_showers,
    95 => :thunderstorm,
    96 => :thunderstorm,
    99 => :thunderstorm
  }.freeze

  def self.fetch_weather(latitude, longitude)
    return nil if latitude.blank? || longitude.blank?

    key = cache_key(latitude, longitude)
    Rails.cache.fetch(key, expires_in: CACHE_DURATION, skip_nil: true) do
      request_weather(latitude, longitude)
    end
  rescue Faraday::TimeoutError, Faraday::ConnectionFailed, JSON::ParserError => e
    Rails.logger.warn("WeatherService error: #{e.class} - #{e.message}")
    nil
  end

  def self.request_weather(latitude, longitude)
    response = fetch_api_response(latitude, longitude)
    return nil unless response&.status == 200

    parse_weather_response(response.body)
  end
  private_class_method :request_weather

  def self.fetch_api_response(latitude, longitude)
    http_client.get do |req|
      req.params["latitude"] = latitude
      req.params["longitude"] = longitude
      req.params["current"] = CURRENT_PARAMS
    end
  end
  private_class_method :fetch_api_response

  def self.parse_weather_response(body)
    payload = JSON.parse(body)
    current = payload["current"]
    return nil if current.blank?

    temp = current["temperature_2m"]
    code = current["weather_code"]
    return nil if temp.nil? || code.nil?

    {
      temp: temp.to_f,
      condition: weather_code_to_symbol(code.to_i)
    }
  end
  private_class_method :parse_weather_response

  def self.http_client
    @http_client ||= Faraday.new(url: API_URL) do |builder|
      builder.options.timeout = TIMEOUT
      builder.options.open_timeout = TIMEOUT
      builder.adapter Faraday.default_adapter
    end
  end
  private_class_method :http_client

  def self.cache_key(latitude, longitude)
    "weather_#{latitude.to_f.round(3)}_#{longitude.to_f.round(3)}"
  end
  private_class_method :cache_key

  def self.weather_code_to_symbol(code)
    WEATHER_CODE_MAP[code] || :unknown
  end
  private_class_method :weather_code_to_symbol
end
