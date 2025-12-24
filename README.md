## 技術スタック

### Backend (Rails)
- Ruby 3.2
- Rails 7.1 (API mode)
- PostgreSQL 15
- RSpec (テスト)
- RuboCop (Lint)
- FactoryBot & Faker (テストデータ)

### Frontend (Next.js)
- Next.js 14
- TypeScript
- TailwindCSS
- ESLint

## セットアップ

```bash
# 環境変数ファイルを作成
cp .env.example .env

# Docker コンテナをビルド・起動
docker-compose up -d

# データベースのセットアップ
docker-compose exec backend rails db:create db:migrate

# ブラウザでアクセス
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001
```

## 開発コマンド

### Backend (Rails)

```bash
# コンテナに入る
docker-compose exec backend bash

# NOTE: `ActiveRecord::Migration.maintain_test_schema!` は schema.rb の
# geography/geometry 関数呼び出しでエラーになる環境があるため（PostGIS）
# テスト実行時の自動スキーマ読み込みはここでは行わない。
# テスト用 DB は手動でマイグレーションを適用しておいてください。
# 例: `RAILS_ENV=test bin/rails db:drop db:create db:migrate`

# テスト実行
docker-compose exec backend rspec

# Lint チェック
docker-compose exec backend rubocop

# Lint 自動修正
docker-compose exec backend rubocop -A

# Rails コンソール
docker-compose exec backend rails console
```

### Frontend (Next.js)

```bash
# コンテナに入る
docker-compose exec frontend sh

# テスト実行
docker-compose exec frontend npm test

# Lint チェック
docker-compose exec frontend npm run lint

# Lint 自動修正
docker-compose exec frontend npm run lint:fix

# ビルド
docker-compose exec frontend npm run build

# frontend コンテナ内で整形を実行して ESLint 自動修正もかける（推奨順）
docker compose exec frontend sh -lc "cd /app && npm run format"

docker compose exec frontend sh -lc "cd /app && npm run lint:fix || true"
```

## CI/CD

このプロジェクトは GitHub Actions を使用した自動テスト・品質チェックを実装しています。

### 自動実行される CI パイプライン

- **Backend CI**: RSpec テスト、RuboCop Lint、セキュリティチェック
- **Frontend CI**: ESLint、TypeScript 型チェック、ビルドチェック、セキュリティチェック
- **Full Stack CI**: 統合テスト、Docker Compose による疎通確認

### ローカルで CI を実行

```bash
# すべての CI チェックを実行
./scripts/run-ci-locally.sh all


scriptsを参照

# 統合テストのみ
./scripts/run-ci-locally.sh integration
```

### Git Hooks のセットアップ

コミット前に自動でチェックを実行:

```bash
./.githooks/setup-hooks.sh
```

詳細は [CI/CD 設定ガイド](docs/CI_SETUP.md) を参照してください。


## 技術的チャレンジ

以下は本プロジェクトで取り組んだ主要な技術的課題と、それに対して採用したアプローチのメモです（メンテナ向けの備忘録）。

### CSRF 実装まとめ（現状）

- エンドポイント: `GET /api/v1/auth/csrf` は `form_authenticity_token` を生成し、JSON に `csrf_token` を返すと同時に `XSRF-TOKEN` クッキーをセットします（`httponly: false`、`same_site: :lax`、`secure` は本番で true）。
- フロント: `frontend/src/lib/api/client.ts` が非GET（POST/PUT/PATCH/DELETE）リクエスト時に `fetchCsrf()` を呼び、JSON の `csrf_token` を `X-CSRF-Token` ヘッダとして付与します。ブラウザ側は `credentials: 'include'` で認証クッキーを自動送信します。
- 認証クッキー: `ApplicationController#cookie_options` により `access_token`/`client`/`uid` は `httponly: true`（JS不可）で発行されます。CSRF トークン用クッキーは JS で読めるよう `httponly: false` に設定しています。

### デプロイ時の注意点（必読）

- 本番では `ENV["COOKIE_DOMAIN"]` を設定してサブドメイン間で Cookie が共有できるようにしてください（`CsrfController` は `cookie_options[:domain]` を使用します）。
- 本番環境では必ず HTTPS を有効にし、`secure: true` が適用されていることを確認してください。
- `Access-Control-Allow-Credentials: true` と `Access-Control-Allow-Origin` を適切に設定し、ワイルドカードは避けてください。

### テスト・検証手順（開発者向け）

- ローカルでの手順:
	1. `docker compose up -d` でコンテナ起動
	2. `docker compose exec -e CI=true backend bundle exec rspec` で request spec を実行
	3. ブラウザでログイン操作を行い DevTools の Network -> Fetch/XHR で `GET /api/v1/auth/csrf` → `POST /api/v1/auth/sign_in` の順に `X-CSRF-Token` ヘッダが付与されることを確認
- E2E: ブラウザ環境での完全検証は Playwright/Cypress 等で自動化することを推奨します。

### 実装上のトレードオフ

- 互換性優先のため CSRF 用 Cookie を `httponly: false` にしています。認証用 Cookie は `httponly: true` に保ち、XSS 緩和（CSP 等）を併用してください。JSON トークン受け取りへ完全移行する場合は `httponly: true` に変更可能ですが、フロント全体の改修が必要です。


- Stage2/Stage3 の CSRF 対応
	- 背景: SPA（Next.js）側で XHR/fetch を使う場合、CSRF 保護を担保しつつブラウザに認証情報（トークン）を安全に保持・送信させる必要がありました。
	- 採用した方針:
		- Stage2: 認証は httpOnly の暗号化 Cookie（サーバ発行）で維持しつつ、JS に読み取らせる `XSRF-TOKEN` cookie を別途発行してフロントが `X-CSRF-Token` ヘッダを付与できるようにする方式を実装しました。
		- Stage3: フロントの `localStorage` 保存とヘッダ自動付与を廃止し、認証はブラウザの Cookie 自動送信のみで一本化する方針を想定しています。
	- 技術的留意点:
		- Rails の `protect_from_forgery` は環境ごとに挙動を変えています（`test` では無効化、`development` は `:null_session`、`production` は `:exception`）。RSpec の制約（encrypted cookie が `response.cookies` に現れない等）に合わせてテストはヘッダベースに調整しました。

- Cookie とヘッダの互換レイヤ
	- 課題: 既存のクライアントやテスト環境の観測性の違いのため、一時的にサーバ側で「Cookie ↔ Header」ブリッジを実装して互換を取っていました。
	- 決定: Stage3 方針でこの互換レイヤは削除し、サーバは `Set-Cookie` のみを発行、クライアントは Cookie 自動送信に頼る構成へ移行します。テストは E2E での検証が望ましいですが、現状の RSpec 制約を考慮して unit/request spec の見直しを行っています。

- セキュリティ設定（Cookie / CORS）
	- 実装上の注力点:
		- 認証 Cookie: `httponly: true`（JS から不可）、`secure: true`（本番）、`same_site` を用途に応じて調整。
		- XSRF トークン（必要なら）: JS で読み取るため `httponly: false` の別クッキーを発行する選択肢を使用。
		- CORS: `Access-Control-Allow-Credentials` を有効にし、`Access-Control-Allow-Origin` をワイルドカードにせず限定すること。

- テスト戦略
	- 単体/リクエストスペック: RSpec の制約により、暗号化 cookie の完全なブラウザ挙動は検証困難。よってサーバロジックはヘッダベースや internal helper 経由で検証し、ブラウザ動作は E2E に委ねる設計（E2E を今後導入予定）。
	- CI: RuboCop / Brakeman / Bundler Audit を導入し静的解析・セキュリティチェックを自動化しています。

- フロントエンド（Next.js）側の実装
	- fetch クライアントは `credentials: 'include'` を利用してブラウザに Cookie の送信を任せる実装へ整理。
	- 以前は `localStorage` にレスポンスヘッダを保存していたが、Stage3 で削除予定（トークン露出リスク低減のため）。

- 運用と移行
	- 段階的ロールアウトを推奨（`ENABLE_STAGE2_CSRF` のようなフラグで挙動切替）。
	- 既存クライアント互換性がある場合は短期の互換レイヤまたは同時デプロイ戦略を採ること。

このセクションは随時更新するメモです。詳しい手順やコード参照が必要なら、該当ファイル（`backend/app/controllers/application_controller.rb`, `frontend/src/lib/api/client.ts` など）へリンクを貼ってドキュメント化します。
