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
