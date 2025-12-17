# frozen_string_literal: true

# API-only mode: Devise/Wardenがセッションに書き込むのを防ぐパッチ
# セッションが無効化されている環境で DeviseTokenAuth を使用する場合に必要

# 1. Deviseの bypass_sign_in メソッドをオーバーライド
module Devise
  module Controllers
    module SignInOut
      def bypass_sign_in(resource, scope: nil)
        scope ||= Devise::Mapping.find_scope!(resource)
        # セッションへの書き込みをスキップし、インスタンス変数のみセット
        instance_variable_set(:"@current_#{scope}", resource)
      end
    end
  end
end

# 2. Warden::SessionSerializerのstoreメソッドをオーバーライド
module Warden
  class SessionSerializer
    def store(user, scope)
      # セッションへの書き込みを完全にスキップ
      # 何もしない（no-op）
      return if defined?(Rails) && Rails.configuration.session_store == :disabled
      # デフォルトの動作（本来はここでsessionに書き込む）
      # session["warden.user.#{scope}.key"] = serialize(user)
    end
  end
end
