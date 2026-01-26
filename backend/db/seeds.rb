# シードデータ作成
Rails.logger.debug "🌱 Creating seed data..."

# 組織1: テスト組織
org1 = Organization.find_or_create_by!(name: "テスト組織")
Rails.logger.debug { "✅ Organization: #{org1.name}" }

# 管理者ユーザー
admin = User.find_or_initialize_by(email: "admin@example.com")
if admin.new_record?
  admin.assign_attributes(
    name: "管理者太郎",
    password: "Password123",
    password_confirmation: "Password123",
    onboarded: true
  )
  admin.save!
  Rails.logger.debug { "✅ Admin user created: #{admin.email}" }
else
  Rails.logger.debug { "✅ Admin user exists: #{admin.email}" }
end

# 管理者をorg1に追加
Membership.find_or_create_by!(user: admin, organization: org1) do |m|
  m.role = :admin
end
Rails.logger.debug "✅ Admin membership created"

# 作業者ユーザー1
worker1 = User.find_or_initialize_by(email: "worker@example.com")
if worker1.new_record?
  worker1.assign_attributes(
    name: "作業者花子",
    password: "Password123",
    password_confirmation: "Password123",
    onboarded: true,
    home_latitude: 35.6809591,
    home_longitude: 139.7673068,
    home_radius: 500
  )
  worker1.save!
  Rails.logger.debug { "✅ Worker user created: #{worker1.email}" }
else
  Rails.logger.debug { "✅ Worker user exists: #{worker1.email}" }
end

# 作業者をorg1に追加
Membership.find_or_create_by!(user: worker1, organization: org1) do |m|
  m.role = :worker
end
Rails.logger.debug "✅ Worker membership created"

# 作業者ユーザー2
worker2 = User.find_or_initialize_by(email: "worker2@example.com")
if worker2.new_record?
  worker2.assign_attributes(
    name: "作業者次郎",
    password: "Password123",
    password_confirmation: "Password123",
    onboarded: true
  )
  worker2.save!
  Rails.logger.debug { "✅ Worker2 user created: #{worker2.email}" }
else
  Rails.logger.debug { "✅ Worker2 user exists: #{worker2.email}" }
end

# 作業者2をorg1に追加
Membership.find_or_create_by!(user: worker2, organization: org1) do |m|
  m.role = :worker
end
Rails.logger.debug "✅ Worker2 membership created"

# 作業セッションとログデータを作成
Rails.logger.debug "\n📍 Creating work session and safety logs..."

# worker1の稼働中セッション
ws = WorkSession.find_or_initialize_by(user: worker1, ended_at: nil)
if ws.new_record?
  ws.started_at = 2.hours.ago
  ws.save!
  Rails.logger.debug { "✅ Work session created for #{worker1.name}" }
else
  Rails.logger.debug { "✅ Work session exists for #{worker1.name}" }
end

# SafetyLogがまだなければ作成
if ws.safety_logs.none?
  locations = [
    { lat: 35.6809591, lng: 139.7673068, name: "東京駅" },
    { lat: 35.6812405, lng: 139.7671248, name: "東京駅付近1" },
    { lat: 35.6815891, lng: 139.7668556, name: "東京駅付近2" },
    { lat: 35.6895168, lng: 139.6917143, name: "新宿駅" },
    { lat: 35.6897554, lng: 139.6913947, name: "新宿駅付近1" },
    { lat: 35.6580339, lng: 139.7016358, name: "渋谷駅" },
    { lat: 35.7100627, lng: 139.8107004, name: "秋葉原駅" },
    { lat: 35.6284713, lng: 139.7362583, name: "品川駅" }
  ]

  batteries = [95, 90, 85, 80, 75, 70, 65, 60]
  triggers = %w[heartbeat check_in heartbeat heartbeat check_in heartbeat heartbeat sos]
  conditions = %i[clear cloudy clear cloudy rainy clear clear clear]
  temps = [22.5, 23.0, 24.5, 36.0, 25.0, 26.5, 21.0, 37.5]

  # rubocop:disable Metrics/BlockLength
  locations.each_with_index do |loc, idx|
    log = SafetyLog.create!(
      work_session: ws,
      lonlat: "POINT(#{loc[:lng]} #{loc[:lat]})",
      battery_level: batteries[idx],
      trigger_type: triggers[idx],
      logged_at: (120 - (idx * 15)).minutes.ago,
      gps_accuracy: rand(5.0..20.0).round(1),
      weather_temp: temps[idx],
      weather_condition: conditions[idx]
    )

    risk_level = if triggers[idx] == "sos" || batteries[idx] < 65
                   "danger"
                 elsif batteries[idx] >= 80
                   "safe"
                 else
                   "caution"
                 end

    score = case risk_level
            when "safe" then rand(0..30)
            when "caution" then rand(40..70)
            when "danger" then rand(80..100)
            end

    reasons = []
    reasons << "low_battery" if batteries[idx] < 70
    reasons << "high_temperature" if temps[idx] >= 35
    reasons << "sos_triggered" if triggers[idx] == "sos"

    temp_score = if temps[idx] >= 35
                   30
                 else
                   (temps[idx] > 30 ? 10 : 0)
                 end

    RiskAssessment.create!(
      safety_log: log,
      level: risk_level,
      score: score,
      details: {
        battery_score: batteries[idx] < 70 ? 20 : -10,
        temperature_score: temp_score,
        sos_score: triggers[idx] == "sos" ? 50 : 0,
        reasons: reasons,
        total: score
      }
    )

    if risk_level == "danger"
      alert_type = triggers[idx] == "sos" ? "sos" : "risk_high"
      severity = triggers[idx] == "sos" ? "critical" : "high"
      message = triggers[idx] == "sos" ? "SOSアラート: #{worker1.name}" : "高リスク検出: #{worker1.name}"

      Alert.find_or_create_by!(
        organization: org1,
        user: worker1,
        work_session: ws,
        safety_log: log,
        alert_type: alert_type,
        severity: severity
      ) do |alert|
        alert.message = message
        alert.status = :open
      end
    end

    Rails.logger.debug do
      logged_at = (120 - (idx * 15)).minutes.ago
      time = logged_at.strftime("%H:%M")
      battery = batteries[idx]
      temp = temps[idx]
      "  ✓ #{time} - #{loc[:name]} (#{triggers[idx]}, 電池#{battery}%, 気温#{temp}°C, #{risk_level})"
    end
  end
  # rubocop:enable Metrics/BlockLength
end

Rails.logger.debug "\n✅ Seed data created successfully!"
Rails.logger.debug "=" * 50
Rails.logger.debug "ログイン情報:"
Rails.logger.debug "  管理者: admin@example.com / Password123"
Rails.logger.debug "  作業者1: worker@example.com / Password123"
Rails.logger.debug "  作業者2: worker2@example.com / Password123"
Rails.logger.debug "=" * 50
Rails.logger.debug { "Users: #{User.count}" }
Rails.logger.debug { "Organizations: #{Organization.count}" }
Rails.logger.debug { "Memberships: #{Membership.count}" }
Rails.logger.debug { "WorkSessions: #{WorkSession.count}" }
Rails.logger.debug { "SafetyLogs: #{SafetyLog.count}" }
Rails.logger.debug { "RiskAssessments: #{RiskAssessment.count}" }
Rails.logger.debug { "Alerts: #{Alert.count}" }
