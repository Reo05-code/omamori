# frozen_string_literal: true

module SafetyLogsPagination
  extend ActiveSupport::Concern

  private

  # ページネーションパラメータを取得・バリデーション
  def pagination_params
    per_page = (params[:per_page] || 100).to_i
    per_page = 100 if per_page <= 0
    per_page = [per_page, 1000].min
    page = (params[:page] || 1).to_i
    page = 1 if page <= 0
    [page, per_page]
  end

  # ページネーション対応のSafetyLog取得
  def build_safety_logs(page, per_page)
    direction = order_direction
    @work_session.safety_logs
                 .order("logged_at #{direction}")
                 .page(page)
                 .per(per_page)
  end

  # ソート順を取得（デフォルト: ASC）
  def order_direction
    raw = params[:order].to_s.downcase
    return "DESC" if raw == "desc"

    "ASC"
  end

  # ページネーションヘッダーを設定
  def add_pagination_headers(logs)
    response.set_header("X-Total-Count", logs.total_count.to_s)
    response.set_header("X-Total-Pages", logs.total_pages.to_s)
    response.set_header("X-Per-Page", logs.limit_value.to_s)
    response.set_header("X-Current-Page", logs.current_page.to_s)
  end
end
