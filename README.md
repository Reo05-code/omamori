# Rails + Next.js フルスタック開発環境

Rails (API) + Next.js (Frontend) の Docker 開発環境です。

# 現在
[![Backend CI](https://github.com/Reo05-code/rails-next-docker-clone/workflows/Backend%20CI/badge.svg)](https://github.com/Reo05-code/rails-next-docker-clone/actions)

# 修正例（テンプレート用）
[![Backend CI](https://github.com/YOUR_USERNAME/YOUR_REPO_NAME/workflows/Backend%20CI/badge.svg)](https://github.com/YOUR_USERNAME/YOUR_REPO_NAME/actions)


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

## ディレクトリ構造

```
.
├── .github/
│   └── workflows/   # GitHub Actions CI設定
├── backend/         # Rails API
│   ├── app/
│   ├── config/
│   ├── db/
│   ├── spec/       # RSpec テスト
│   └── ...
├── frontend/       # Next.js
│   ├── src/
│   ├── public/
│   └── ...
├── docs/           # ドキュメント
├── docker-compose.yml
└── README.md
```
