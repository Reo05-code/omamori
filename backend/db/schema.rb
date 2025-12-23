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

ActiveRecord::Schema[7.2].define(version: 2025_12_23_133448) do
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

  create_table "spatial_ref_sys", primary_key: "srid", id: :integer, default: nil, force: :cascade do |t|
    t.string "auth_name", limit: 256
    t.integer "auth_srid"
    t.string "srtext", limit: 2048
    t.string "proj4text", limit: 2048
    t.check_constraint "srid > 0 AND srid <= 998999", name: "spatial_ref_sys_srid_check"
  end

# Could not dump table "users" because of following StandardError
#   Unknown type 'geography' for column 'home_location'


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
