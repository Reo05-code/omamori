# frozen_string_literal: true

module Api
  module V1
    class WorkSessionsController < ApplicationController
      # 内容:
      # - 作業セッションのライフサイクル（作成/終了/キャンセル/参照/現在取得）を提供するAPI
      # - 認可判定は `WorkSessionPolicy` の `Result` を使用し、許可されない場合は 403 ではなく
      #   状況に応じて 404 (存在を隠蔽) を返す呼び分けを行います。
      # - 作成フローは build -> policy 判定 -> 排他ロックでの保存 の順で実行し、監査のため
      #   `created_by_user_id` を記録します。共通処理は `WorkSessionHelpers` に切り出しています。
      before_action :authenticate_user!
      include ParamsTimeParsing
      include WorkSessionHelpers

      # 作業セッションの詳細を返す
      # GET /api/v1/work_sessions/:id
      def show
        work_session = WorkSession.find(params[:id])
        result = WorkSessionPolicy.new(current_user, work_session).show
        return render_work_session_not_found unless result.allowed?

        render json: Api::V1::WorkSessionDetailSerializer.new(work_session).as_json
      rescue ActiveRecord::RecordNotFound
        render json: { errors: ["作業セッションが見つかりません"] }, status: :not_found
      end

      # 作業セッションを新規作成する
      # POST /api/v1/work_sessions
      def create
        org = find_user_organization!(organization_id_param)
        target_user = determine_target_user(org)

        perform_create(org, target_user)
      rescue ActiveRecord::RecordNotFound
        render json: { errors: ["組織が見つかりません"] }, status: :not_found
      rescue ArgumentError
        render json: { errors: ["started_at の形式が不正です"] }, status: :unprocessable_content
      rescue ActiveRecord::RecordInvalid => e
        render_validation_errors(e, fallback: "作業セッションの作成に失敗しました")
      end

      def perform_create(org, target_user)
        work_session = build_new_work_session(org, target_user)

        case policy_create_status(work_session)
        when :forbidden
          return render_forbidden
        when :not_found
          return render_not_found("組織が見つかりません")
        end

        return if render_active_session_exists?(target_user)

        save_work_session!(target_user, work_session)
        render_created(work_session)
      end

      # 作業セッションを終了する（ended_at を設定して完了にする）
      # POST /api/v1/work_sessions/:id/finish
      def finish
        work_session = WorkSession.find(params[:id])
        return unless ensure_authorized_for?(:finish, work_session)

        work_session.with_lock do
          return unless finish_precheck?(work_session)

          finish_work_session!(work_session)
        end

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
        work_session = WorkSession.find(params[:id])
        return unless ensure_authorized_for?(:cancel, work_session)

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

      def render_forbidden
        render json: { errors: ["この操作を実行する権限がありません"] }, status: :forbidden
      end

      def render_not_found(message)
        render json: { errors: [message] }, status: :not_found
      end

      def render_work_session_not_found
        render_not_found("作業セッションが見つかりません")
      end

      # helper methods moved to WorkSessionHelpers concern

      # 対象ユーザーを決定（user_id パラメータがある場合は指定ユーザー、なければ自分）
      def determine_target_user(organization)
        user_id = params.dig(:work_session, :user_id) || params[:user_id]

        if user_id.present?
          # user_id が指定されている場合は組織内から検索
          organization.users.find(user_id)
        else
          # 指定がなければ自分自身
          current_user
        end
      end

      # 保存専用メソッド（排他ロックで重複作成を防止）
      def save_work_session!(target_user, work_session)
        target_user.with_lock do
          if target_user.work_sessions.active.exists?
            work_session.errors.add(:base, "既に進行中の作業セッションがあります")
            raise ActiveRecord::RecordInvalid, work_session
          end

          work_session.save!
        end
      end

      def finish_work_session!(session)
        session.end!(ended_at: ended_at_param)
      end
    end
  end
end
