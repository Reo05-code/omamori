class EnablePostgis < ActiveRecord::Migration[7.2]
  def change
    enable_extension "postgis" unless extension_enabled?("postgis")
  end
end
