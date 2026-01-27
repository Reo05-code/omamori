# frozen_string_literal: true

# Home location に関する Concern
# rubocop:disable Metrics/ModuleLength
module HomeLocationable
  extend ActiveSupport::Concern

  included do
    validate :validate_and_compose_home_location
    validate :validate_coordinate_ranges
  end

  # 緯度取得/設定
  def home_latitude
    return @home_latitude unless @home_latitude.nil?
    return nil unless home_location

    home_location.y
  end

  def home_latitude=(val)
    @home_latitude_assigned = true

    if val.nil? || val == "" || val.blank?
      @home_latitude = nil
      return
    end

    begin
      @home_latitude = Float(val)
    rescue ArgumentError, TypeError
      @home_latitude = :invalid
    end
  end

  # 経度取得/設定
  def home_longitude
    return @home_longitude unless @home_longitude.nil?
    return nil unless home_location

    home_location.x
  end

  def home_longitude=(val)
    @home_longitude_assigned = true

    if val.nil? || val == "" || val.blank?
      @home_longitude = nil
      return
    end

    begin
      @home_longitude = Float(val)
    rescue ArgumentError, TypeError
      @home_longitude = :invalid
    end
  end

  private

  # setter が呼ばれたかで判定する（明示的な null と未送信を区別するため）
  def input_provided?
    @home_latitude_assigned || @home_longitude_assigned
  end

  # 両方が割り当てられていて両方 nil の場合は明示削除
  def explicit_delete?
    @home_latitude_assigned && @home_longitude_assigned && @home_latitude.nil? && @home_longitude.nil?
  end

  # invalid sentinel チェックを分離
  def handle_invalid_sentinels
    errors.add(:home_latitude, "数値で指定してください") if @home_latitude == :invalid
    errors.add(:home_longitude, "数値で指定してください") if @home_longitude == :invalid
  end

  # 座標の範囲バリデーション（セキュリティ対策）
  def validate_coordinate_ranges
    validate_latitude_range
    validate_longitude_range
    validate_radius_range
  end

  def validate_latitude_range
    return unless @home_latitude.is_a?(Numeric)
    return if @home_latitude.between?(-90, 90)

    errors.add(:home_latitude, "緯度は-90から90の範囲で指定してください")
  end

  def validate_longitude_range
    return unless @home_longitude.is_a?(Numeric)
    return if @home_longitude.between?(-180, 180)

    errors.add(:home_longitude, "経度は-180から180の範囲で指定してください")
  end

  def validate_radius_range
    return unless home_radius.present? && home_radius.is_a?(Numeric)
    return if home_radius.between?(1, 10_000)

    errors.add(:home_radius, "半径は1メートルから10kmの範囲で指定してください")
  end

  # 両方の座標が入力されているか検証
  def both_coords_present?
    if @home_latitude.nil? || @home_longitude.nil?
      errors.add(:home_latitude, "緯度と経度は両方必要です")
      errors.add(:home_longitude, "緯度と経度は両方必要です")
      return false
    end

    true
  end

  # 両方の座標が存在する場合、既に Float に変換済みの値を返す
  def parse_coords
    [@home_latitude, @home_longitude]
  end

  # 座標の範囲検証
  def validate_ranges(lat, lon)
    errors.add(:home_latitude, "は -90 から 90 の間で指定してください") unless (-90.0..90.0).cover?(lat)
    errors.add(:home_longitude, "は -180 から 180 の間で指定してください") unless (-180.0..180.0).cover?(lon)
  end

  # 入力検証と home_location の生成を一箇所で行う
  def validate_and_compose_home_location
    return unless input_provided?

    handle_invalid_sentinels
    return if errors.any?

    if explicit_delete?
      self.home_location = nil
      return
    end

    return unless both_coords_present?

    lat, lon = parse_coords

    validate_ranges(lat, lon)
    return if errors.any?

    compose_home_location(lat, lon)
  end

  # 座標から home_location を生成
  def compose_home_location(lat, lon)
    factory = if respond_to?(:rgeo_factory_for_column)
                self.class.rgeo_factory_for_column(:home_location)
              else
                RGeo::Geographic.spherical_factory(srid: 4326)
              end

    begin
      self.home_location = factory.point(lon, lat)
    rescue StandardError => e
      Rails.logger.warn("[home_location] compose failed: #{e.class}: #{e.message}")
      errors.add(:home_location, "座標の生成に失敗しました")
    end
  end
end
# rubocop:enable Metrics/ModuleLength
