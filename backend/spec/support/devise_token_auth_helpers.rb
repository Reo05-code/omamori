# frozen_string_literal: true

# DeviseTokenAuth の認証テスト用ヘルパー
# request spec で認証が必要なエンドポイントをテストする際に使用する
module DeviseTokenAuthHelpers
  # ユーザーの認証トークンヘッダーを生成
  # ApplicationController の set_user_by_cookie! が Cookie から header にマップするため、
  # テストでは直接ヘッダーを渡すことで認証をシミュレートできる
  def auth_headers_for(user)
    user.create_new_auth_token
  end

  # 認証済みの GET リクエスト
  def authenticated_get(path, user:, **)
    get(path, headers: auth_headers_for(user), **)
  end

  # 認証済みの POST リクエスト
  def authenticated_post(path, user:, **)
    post(path, headers: auth_headers_for(user), **)
  end

  # 認証済みの PUT リクエスト
  def authenticated_put(path, user:, **)
    put(path, headers: auth_headers_for(user), **)
  end

  # 認証済みの DELETE リクエスト
  def authenticated_delete(path, user:, **)
    delete(path, headers: auth_headers_for(user), **)
  end
end
