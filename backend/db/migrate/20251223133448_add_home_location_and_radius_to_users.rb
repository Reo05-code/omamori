class AddHomeLocationAndRadiusToUsers < ActiveRecord::Migration[7.2]
  def change
    enable_extension "postgis" unless extension_enabled?("postgis")

    add_column :users, :home_location, :geography,
               limit: { srid: 4326, type: "point" }

    add_column :users, :home_radius, :integer, null: false, default: 50

    add_index :users, :home_location, using: :gist
  end
end
