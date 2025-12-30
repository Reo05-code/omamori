# frozen_string_literal: true

class SafetyLog < ApplicationRecord
  belongs_to :work_session
  has_one :risk_assessment, dependent: :destroy
  has_many :alerts, dependent: :nullify

  # lonlatの仮想属性として緯度経度を定義
  attribute :latitude, :float
  attribute :longitude, :float

  HIGH_ACCURACY_THRESHOLD_METERS = 50

  enum :trigger_type, { heartbeat: 0, sos: 1, check_in: 2 }, prefix: true

  validates :logged_at, presence: true
  # バッテリーは 1% から100%
  validates :battery_level, presence: true, numericality: { only_integer: true, in: 0..100 }
  validates :lonlat, presence: true
  validates :trigger_type, presence: true
  validates :gps_accuracy, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true

  # 緯度経度のバリデーション（両方の座標がある場合のみチェック）
  with_options if: -> { latitude.present? || longitude.present? } do
    validates :latitude, inclusion: { in: -90.0..90.0, message: "は -90 から 90 の間で指定してください" }
    validates :longitude, inclusion: { in: -180.0..180.0, message: "は -180 から 180 の間で指定してください" }
  end

  validate :both_coords_present, if: -> { latitude.present? || longitude.present? }

  # lonlat が生成されなかった場合のエラーチェック
  validate :lonlat_must_be_present

  # データ読み込み時に lonlat から仮想属性へ値を戻す
  after_initialize :set_coords_from_lonlat, if: -> { lonlat.present? && latitude.nil? }
  # --- 3. コールバックで変換 ---
  # バリデーション前に lonlat オブジェクトを生成
  before_validation :compose_lonlat_from_coords

  # GPS精度（誤差）が50m以内のログ
  scope :high_accuracy, -> { where(gps_accuracy: ..HIGH_ACCURACY_THRESHOLD_METERS) }
  scope :recent, -> { order(logged_at: :desc) }

  private

  # バリデーションを通過した正しい数値に対して文字列埋め込みを行う
  def compose_lonlat_from_coords
    return unless latitude.present? && longitude.present?

    self.lonlat = "SRID=4326;POINT(#{longitude} #{latitude})"
  end

  def set_coords_from_lonlat
    # DB から取り出した lonlat は環境によって RGeo オブジェクト、WKB(HEX)文字列、WKT など様々
    point = if lonlat.respond_to?(:y)
              lonlat
            elsif lonlat.is_a?(String)
              parse_lonlat_string(lonlat)
            end

    return unless point

    self.latitude = point.y
    self.longitude = point.x
  end

  def parse_lonlat_string(value)
    factory = RGeo::Geographic.spherical_factory(srid: 4326)

    # WKB (hex) を試す
    begin
      parser = RGeo::WKRep::WKBParser.new(factory, support_ewkb: true, hex_format: true)
      return parser.parse(value)
    rescue StandardError
      # fallthrough to WKT
    end

    begin
      parser = RGeo::WKRep::WKTParser.new(factory, support_ewkt: true)
      parser.parse(value)
    rescue StandardError
      nil
    end
  end

  def lonlat_must_be_present
    # lonlat が生成されなかった（nil）のは、緯度経度が部分的にしか与えられた、あるいは明示的に位置情報が欲しいケースなので、座標どちらかが与えられている場合はモデルエラーにする
    return unless lonlat.nil? && (latitude.present? || longitude.present?)

    errors.add(:base, "緯度と経度はセットで入力してください")
  end

  def both_coords_present
    return unless latitude.present? ^ longitude.present?

    errors.add(:base, "緯度と経度はセットで入力してください")
  end
end
