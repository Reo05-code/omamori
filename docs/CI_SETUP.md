# CI/CD 設定ガイド

このプロジェクトは GitHub Actions を使用して、バックエンドとフロントエンドの独立した CI パイプラインを提供します。

## 📋 ワークフロー概要

### 1. Backend CI (`.github/workflows/backend-ci.yml`)

Rails バックエンドの自動テストと品質チェック

**トリガー条件:**
- `main` または `develop` ブランチへの push
- `main` または `develop` ブランチへの Pull Request
- `backend/` ディレクトリまたは CI 設定ファイルの変更時のみ実行

**ジョブ構成:**

#### テスト (`test`)
- Ruby 3.2.9 + Rails 7.1
- PostgreSQL 15 でのテスト実行
- RSpec テストスイート実行
- カバレッジレポート生成・アップロード

#### Lint (`lint`)
- RuboCop による静的解析
- コーディング規約チェック

#### セキュリティ (`security`)
- Bundler Audit による脆弱性チェック
- 依存関係のセキュリティスキャン

### 2. Frontend CI (`.github/workflows/frontend-ci.yml`)

Next.js フロントエンドの自動テストと品質チェック

**トリガー条件:**
- `main` または `develop` ブランチへの push
- `main` または `develop` ブランチへの Pull Request
- `frontend/` ディレクトリまたは CI 設定ファイルの変更時のみ実行

**ジョブ構成:**

#### Lint & Type Check (`lint`)
- ESLint による静的解析
- TypeScript 型チェック

#### ビルドチェック (`build`)
- Next.js プロダクションビルド
- ビルド成果物のアーティファクト保存

#### セキュリティ (`security`)
- npm audit による脆弱性チェック
- 依存関係のセキュリティスキャン

### 3. Full Stack CI (`.github/workflows/full-ci.yml`)

統合 CI パイプライン

**トリガー条件:**
- すべてのブランチへの push と Pull Request

**ジョブ構成:**

#### 変更検出 (`detect-changes`)
- 変更されたファイルを検出
- 必要な CI ジョブのみを実行（効率化）

#### 統合テスト (`integration`)
- Docker Compose で全サービス起動
- バックエンド・フロントエンドの疎通確認
- ヘルスチェック実行

## 🚀 ローカルでの CI 実行

### Backend

```bash
# テスト実行
docker-compose exec backend rspec

# Lint チェック
docker-compose exec backend rubocop

# Lint 自動修正
docker-compose exec backend rubocop -A

# セキュリティチェック
docker-compose exec backend bash -c "gem install bundler-audit && bundler-audit check --update"
```

### Frontend

```bash
# Lint チェック
docker-compose exec frontend npm run lint

# Lint 自動修正
docker-compose exec frontend npm run lint:fix

# 型チェック
docker-compose exec frontend npm run type-check

# ビルドチェック
docker-compose exec frontend npm run build

# セキュリティチェック
docker-compose exec frontend npm audit
```

## 📊 CI バッジ

README.md に以下のバッジを追加できます:

```markdown
![Backend CI](https://github.com/YOUR_USERNAME/YOUR_REPO/workflows/Backend%20CI/badge.svg)
![Frontend CI](https://github.com/YOUR_USERNAME/YOUR_REPO/workflows/Frontend%20CI/badge.svg)
![Full Stack CI](https://github.com/YOUR_USERNAME/YOUR_REPO/workflows/Full%20Stack%20CI/badge.svg)
```

## 🔧 CI 設定のカスタマイズ

### テストカバレッジの閾値設定

`backend/spec/spec_helper.rb` で SimpleCov の設定を調整:

```ruby
SimpleCov.start 'rails' do
  minimum_coverage 80  # 最低カバレッジを設定
  add_filter '/spec/'
  add_filter '/config/'
end
```

### セキュリティチェックの除外

脆弱性の除外が必要な場合:

```bash
# Backend
echo "CVE-XXXX-XXXX" >> backend/.bundler-audit-ignore

# Frontend
npm audit fix
```

## 💡 ベストプラクティス

1. **Pull Request 作成前に必ずローカルで CI を実行**
   ```bash
   # Backend
   docker-compose exec backend rspec
   docker-compose exec backend rubocop

   # Frontend
   docker-compose exec frontend npm run lint
   docker-compose exec frontend npm run type-check
   ```

2. **コミット前の自動チェック**
   - Git hooks（pre-commit）の設定を推奨
   - Husky や Lefthook の導入を検討

3. **ブランチ戦略**
   - `main`: プロダクション用
   - `develop`: 開発用
   - `feature/*`: 機能開発用

4. **CI の高速化**
   - 必要な場合のみジョブを実行（変更検出による最適化）
   - Docker キャッシュの活用
   - 並列実行の活用

## 🐛 トラブルシューティング

### CI が失敗する場合

1. **ローカルで同じコマンドを実行して再現**
2. **ログを確認**（GitHub Actions の詳細ログ）
3. **依存関係の更新**
   ```bash
   # Backend
   docker-compose exec backend bundle update

   # Frontend
   docker-compose exec frontend npm update
   ```

### タイムアウトする場合

ワークフローファイルの `timeout-minutes` を調整:

```yaml
jobs:
  test:
    timeout-minutes: 30  # デフォルトは 360 分
```

## 📝 関連リンク

- [GitHub Actions ドキュメント](https://docs.github.com/ja/actions)
- [RSpec 公式ドキュメント](https://rspec.info/)
- [RuboCop 公式ドキュメント](https://docs.rubocop.org/)
- [ESLint 公式ドキュメント](https://eslint.org/)
- [Next.js CI 設定](https://nextjs.org/docs/deployment#continuous-integration-ci)
