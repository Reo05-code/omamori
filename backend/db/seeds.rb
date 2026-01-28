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

# SafetyLogを削除してから新規作成（ページネーション確認用に250件作成）
Rails.logger.debug "Deleting existing safety logs..."
ws.safety_logs.destroy_all

Rails.logger.debug "Creating 250 safety logs for pagination testing..."

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

  total_logs = 250

  # rubocop:disable Metrics/BlockLength
  total_logs.times do |idx|
    loc_idx = idx % locations.length
    loc = locations[loc_idx]
    battery_idx = idx % batteries.length
    trigger_idx = idx % triggers.length
    condition_idx = idx % conditions.length
    temp_idx = idx % temps.length

    # 古いログから順に作成（最新が最後）
    logged_at = (total_logs * 15 - (idx * 15)).minutes.ago

    log = SafetyLog.create!(
      work_session: ws,
      lonlat: "POINT(#{loc[:lng]} #{loc[:lat]})",
      battery_level: batteries[battery_idx],
      trigger_type: triggers[trigger_idx],
      logged_at: logged_at,
      gps_accuracy: rand(5.0..20.0).round(1),
      weather_temp: temps[temp_idx],
      weather_condition: conditions[condition_idx]
    )

    current_trigger = triggers[trigger_idx]
    current_battery = batteries[battery_idx]
    current_temp = temps[temp_idx]

    risk_level = if current_trigger == "sos" || current_battery < 65
                   "danger"
                 elsif current_battery >= 80
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
    reasons << "low_battery" if current_battery < 70
    reasons << "high_temperature" if current_temp >= 35
    reasons << "sos_trigger" if current_trigger == "sos"

    temp_score = if current_temp >= 35
                   30
                 else
                   (current_temp > 30 ? 10 : 0)
                 end

    RiskAssessment.create!(
      safety_log: log,
      level: risk_level,
      score: score,
      details: {
        battery_score: current_battery < 70 ? 20 : -10,
        temperature_score: temp_score,
        sos_score: current_trigger == "sos" ? 50 : 0,
        reasons: reasons,
        total: score
      }
    )

    # 最初の50件のみアラート作成（全件作成すると重すぎる）
    if idx < 50 && risk_level == "danger"
      alert_type = current_trigger == "sos" ? "sos" : "risk_high"
      severity = current_trigger == "sos" ? "critical" : "high"

      Alert.find_or_create_by!(
        work_session: ws,
        safety_log: log,
        alert_type: alert_type,
        severity: severity,
        status: :open
      )
    end

    # 進捗表示（10件ごと）
    if (idx + 1) % 10 == 0
      Rails.logger.debug "  Created #{idx + 1}/#{total_logs} logs..."
    end
  end
  # rubocop:enable Metrics/BlockLength

  Rails.logger.debug "✅ Created #{total_logs} safety logs (#{ws.safety_logs.count} total)"

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
