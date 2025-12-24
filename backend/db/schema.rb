# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.2].define(version: 2025_12_24_070718) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"
  enable_extension "postgis"

  create_table "invitations", force: :cascade do |t|
    t.bigint "inviter_id", null: false
    t.string "invited_email", null: false
    t.string "token", null: false
    t.integer "role", null: false, comment: "付与されるロール（worker/admin）"
    t.datetime "expires_at"
    t.datetime "accepted_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "organization_id"
    t.index ["inviter_id"], name: "index_invitations_on_inviter_id"
    t.index ["organization_id"], name: "index_invitations_on_organization_id"
    t.index ["token"], name: "index_invitations_on_token", unique: true
  end

  create_table "memberships", force: :cascade do |t|
    t.bigint "organization_id", null: false
    t.bigint "user_id", null: false
    t.integer "role", default: 0, null: false, comment: "0=worker, 1=admin"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["organization_id"], name: "index_memberships_on_organization_id"
    t.index ["user_id", "organization_id"], name: "index_memberships_on_user_id_and_organization_id", unique: true
    t.index ["user_id"], name: "index_memberships_on_user_id"
  end

  create_table "organizations", force: :cascade do |t|
    t.string "name", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "users", force: :cascade do |t|
    t.string "provider", default: "email", null: false
    t.string "uid", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.boolean "allow_password_change", default: false
    t.datetime "remember_created_at"
    t.string "name"
    t.string "phone_number"
    t.string "avatar_url"
    t.string "email"
    t.json "tokens"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.jsonb "settings", default: {}, null: false
    t.geometry "home_location", limit: {:srid=>4326, :type=>"st_point"}
    t.integer "home_radius", default: 50, null: false
    t.boolean "onboarded", default: false, null: false
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["home_location"], name: "index_users_on_home_location", using: :gist
    t.index ["onboarded"], name: "index_users_on_onboarded"
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
    t.index ["uid", "provider"], name: "index_users_on_uid_and_provider", unique: true
  end

  create_table "work_sessions", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "organization_id", null: false
    t.datetime "started_at", null: false
    t.datetime "ended_at"
    t.integer "status", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "active_monitoring_jid"
    t.datetime "scheduled_at"
    t.index ["active_monitoring_jid"], name: "index_work_sessions_on_active_monitoring_jid", unique: true
    t.index ["organization_id"], name: "index_work_sessions_on_organization_id"
    t.index ["scheduled_at"], name: "index_work_sessions_on_scheduled_at"
    t.index ["started_at"], name: "index_work_sessions_on_started_at"
    t.index ["user_id"], name: "index_work_sessions_on_user_id"
  end

  add_foreign_key "invitations", "organizations"
  add_foreign_key "invitations", "users", column: "inviter_id"
  add_foreign_key "memberships", "organizations"
  add_foreign_key "memberships", "users"
  add_foreign_key "work_sessions", "organizations"
  add_foreign_key "work_sessions", "users"
end
