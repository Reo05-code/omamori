# frozen_string_literal: true

# Zeitwerk の設定
# vendor/bundle ディレクトリを autoload/eager_load から除外
Rails.autoloaders.main.ignore(Rails.root.join("vendor"))
