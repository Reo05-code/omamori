# frozen_string_literal: true

module CsrfHelpers
  # CSRF トークンを取得して、以降のリクエストに X-CSRF-Token ヘッダとして付与するヘルパー

  def fetch_csrf_token
    get "/api/v1/auth/csrf", as: :json
    expect(response).to have_http_status(:ok)

    json = JSON.parse(response.body)
    json["csrf_token"]
  end

  def post_with_csrf(path, **options)
    token = fetch_csrf_token
    headers = options[:headers] || {}
    headers["X-CSRF-Token"] = token

    post path, **options.merge(headers: headers)
  end

  def put_with_csrf(path, **options)
    token = fetch_csrf_token
    headers = options[:headers] || {}
    headers["X-CSRF-Token"] = token

    put path, **options.merge(headers: headers)
  end

  def delete_with_csrf(path, **options)
    token = fetch_csrf_token
    headers = options[:headers] || {}
    headers["X-CSRF-Token"] = token

    delete path, **options.merge(headers: headers)
  end
end
