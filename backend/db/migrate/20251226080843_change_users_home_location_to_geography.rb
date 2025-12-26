class ChangeUsersHomeLocationToGeography < ActiveRecord::Migration[7.2]
  def up
    remove_index :users, :home_location if index_exists?(:users, :home_location)

    execute <<~SQL
      ALTER TABLE users
      ALTER COLUMN home_location
      TYPE geography(Point,4326)
      USING ST_SetSRID(home_location, 4326)::geography;
    SQL

    add_index :users, :home_location, using: :gist
  end

  def down
    remove_index :users, :home_location if index_exists?(:users, :home_location)

    execute <<~SQL
      ALTER TABLE users
      ALTER COLUMN home_location
      TYPE geometry(Point,4326)
      USING ST_SetSRID(home_location::geometry, 4326);
    SQL

    add_index :users, :home_location, using: :gist
  end
end
