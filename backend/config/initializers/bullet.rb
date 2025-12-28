# frozen_string_literal: true

if defined?(Bullet)
  Rails.application.config.after_initialize do
    # config/bullet_whitelist.yml を読み込む
    whitelist_path = Rails.root.join("config", "bullet_whitelist.yml")

    if File.exist?(whitelist_path)
      require "yaml"
      # 安全にYAMLをロード
      entries = YAML.safe_load_file(whitelist_path, permitted_classes: [Symbol], aliases: true) || []

      entries.each do |entry|
        if entry.respond_to?(:transform_keys)
          Bullet.add_whitelist(entry.transform_keys(&:to_sym))
        else
          Bullet.add_whitelist(entry)
        end
      end
    end
  end
end
