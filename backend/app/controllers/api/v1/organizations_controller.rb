module Api
  module V1
    class OrganizationsController < ApplicationController
      before_action :authenticate_user!

      def index
        # current_user の所属する組織一覧を返す
        # シリアライザを使って返却属性を限定し、モデル拡張で機密カラムが追加されても誤って露出しないようにする
        orgs = current_user.organizations

        render json: orgs.map { |o| Api::V1::OrganizationSerializer.new(o).as_json }
      end

      def show
        organization = current_user.organizations.find(params[:id])
        render json: Api::V1::OrganizationSerializer.new(organization).as_json
      rescue ActiveRecord::RecordNotFound
        render json: { error: I18n.t("api.v1.organizations.not_found") }, status: :not_found
      end

      def create
        # 組織とそれに対する作成者の Membership を作成する
        # どちらかの処理に失敗した場合はロールバックして不整合を防ぐため transaction を使用する
        ActiveRecord::Base.transaction do
          organization = Organization.create!(organization_params)
          Membership.create!(
            organization: organization,
            user: current_user,
            role: :admin
          )
          # 作成成功時に Location ヘッダを返す
          render json: Api::V1::OrganizationSerializer.new(organization).as_json,
                 status: :created,
                 location: api_v1_organization_path(organization)
        end
      rescue ActiveRecord::RecordInvalid => e
        # バリデーションエラーは詳細メッセージを優先して返し、なければ I18n の汎用メッセージへフォールバックする
        render json: { errors: e.record.errors.full_messages.presence || [I18n.t("api.v1.organizations.error.create")] },
               status: :unprocessable_content
      end

      private

      def organization_params
        params.require(:organization).permit(:name)
      end
    end
  end
end
