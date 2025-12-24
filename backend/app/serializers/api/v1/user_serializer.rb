module Api
  module V1
    # Lightweight serializer for User
    class UserSerializer
      def initialize(user)
        @user = user
      end

      def as_json(*)
        {
          id: @user.id,
          email: @user.email,
          name: @user.name,
          phone_number: @user.phone_number,
          avatar_url: @user.avatar_url,
          onboarded: @user.onboarded,
          organizations_count: @user.organizations.count,
          home_latitude: safe_float(@user.home_latitude),
          home_longitude: safe_float(@user.home_longitude),
          home_radius: @user.home_radius,
          created_at: @user.created_at,
          updated_at: @user.updated_at
        }
      end

      private

      # home_latitude/home_longitude が :invalid の可能性があるため、
      # 数値以外は nil を返すユーティリティ
      def safe_float(val)
        return nil if val.nil? || val == :invalid

        val
      end
    end
  end
end
