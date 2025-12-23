# frozen_string_literal: true

module Api
  module V1
    class WorkSessionsController < ApplicationController
      before_action :authenticate_user!
      include ParamsTimeParsing
      include WorkSessionHelpers

      # 作業セッションの詳細を返す
      # GET /api/v1/work_sessions/:id
      def show
        work_session = find_user_work_session!(params[:id])
        render json: Api::V1::WorkSessionDetailSerializer.new(work_session).as_json
      rescue ActiveRecord::RecordNotFound
        render json: { errors: ["作業セッションが見つかりません"] }, status: :not_found
      end

      # 作業セッションを新規作成する
      # POST /api/v1/work_sessions
      def create
        org = find_user_organization!(organization_id_param)
        return if render_active_session_exists?

        work_session = create_work_session!(org)
        render_created(work_session)
      rescue ActiveRecord::RecordNotFound
        render json: { errors: ["組織が見つかりません"] }, status: :not_found
      rescue ArgumentError
        render json: { errors: ["started_at の形式が不正です"] }, status: :unprocessable_content
      rescue ActiveRecord::RecordInvalid => e
        render_validation_errors(e, fallback: "作業セッションの作成に失敗しました")
      end

      # 作業セッションを終了する（ended_at を設定して完了にする）
      # POST /api/v1/work_sessions/:id/finish
      def finish
        work_session = find_user_work_session!(params[:id])
        return unless finish_precheck?(work_session)

        finish_work_session!(work_session)
        render json: Api::V1::WorkSessionSerializer.new(work_session).as_json
      rescue ActiveRecord::RecordNotFound
        render json: { errors: ["作業セッションが見つかりません"] }, status: :not_found
      rescue ArgumentError
        render json: { errors: ["ended_at の形式が不正です"] }, status: :unprocessable_content
      rescue ActiveRecord::RecordInvalid => e
        render_validation_errors(e, fallback: "作業セッションの終了に失敗しました")
      end

      # 実行中の作業セッションをキャンセルする
      # POST /api/v1/work_sessions/:id/cancel
      def cancel
        work_session = find_user_work_session!(params[:id])

        unless work_session.in_progress?
          render json: { errors: ["進行中のセッションのみキャンセルできます"] }, status: :unprocessable_content
          return
        end

        work_session.cancel!
        render json: Api::V1::WorkSessionSerializer.new(work_session).as_json
      rescue ActiveRecord::RecordNotFound
        render json: { errors: ["作業セッションが見つかりません"] }, status: :not_found
      rescue ActiveRecord::RecordInvalid => e
        render_validation_errors(e, fallback: "作業セッションのキャンセルに失敗しました")
      end

      # 現在進行中の作業セッションを返す（なければ null）
      # GET /api/v1/work_sessions/current
      def current
        session = current_user.work_sessions.active.recent.first
        payload = session ? Api::V1::WorkSessionSerializer.new(session).as_json : nil
        render json: { work_session: payload }
      end

      private

      # 指定組織向けに作業セッションを作成（排他ロックで重複作成を防止）
      def create_work_session!(organization)
        ws = current_user.work_sessions.build(
          organization: organization,
          started_at: started_at_param.presence || Time.current,
          status: :in_progress
        )

        current_user.with_lock do
          if current_user.work_sessions.active.exists?
            ws.errors.add(:base, "既に進行中の作業セッションがあります")
            raise ActiveRecord::RecordInvalid, ws
          end

          ws.save!
        end

        ws
      end

      def finish_work_session!(session)
        session.end!(ended_at: ended_at_param)
      end

      def find_user_work_session!(id)
        current_user.work_sessions.find(id)
      end
    end
  end
end
