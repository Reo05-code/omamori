# frozen_string_literal: true

# テスト実行時に ApplicationJob が見つからずエラーになったため追加
class ApplicationJob < ActiveJob::Base
end
