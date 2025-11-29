# CI/CD クイックスタート

## 🚀 はじめに

このガイドでは、CI/CD を使い始めるための最小限の手順を説明します。

## 📋 前提条件

- Docker と Docker Compose がインストール済み
- Git がインストール済み
- GitHub アカウント（GitHub Actions を使用する場合）

## ⚡ クイックセットアップ

### 1. Git Hooks をセットアップ（推奨）

コミット前に自動でチェックを実行するように設定:

```bash
./.githooks/setup-hooks.sh
```

これで、`git commit` 時に自動的に以下がチェックされます:
- Backend: RuboCop、RSpec
- Frontend: ESLint、TypeScript 型チェック

### 2. ローカルで CI を実行

コミット前に手動でチェック:

```bash
# すべてのチェックを実行
./scripts/run-ci-locally.sh all

# Backend のみ
./scripts/run-ci-locally.sh backend

# Frontend のみ
./scripts/run-ci-locally.sh frontend
```

### 3. GitHub Actions のセットアップ

#### Step 1: リポジトリにプッシュ

```bash
git add .
git commit -m "Add CI/CD configuration"
git push origin main
```

#### Step 2: Actions を有効化

1. GitHub リポジトリページを開く
2. "Actions" タブをクリック
3. ワークフローを有効化

#### Step 3: バッジを更新

`README.md` の以下の部分を編集:

```markdown
[![Backend CI](https://github.com/YOUR_USERNAME/YOUR_REPO/workflows/Backend%20CI/badge.svg)](...)
```

`YOUR_USERNAME` と `YOUR_REPO` を実際の値に置き換える。

## 🔍 CI チェック項目

### Backend (Rails)

| チェック | コマンド | 説明 |
|---------|---------|------|
| テスト | `docker-compose exec backend rspec` | RSpec テストを実行 |
| Lint | `docker-compose exec backend rubocop` | コード品質チェック |
| セキュリティ | `gem install bundler-audit && bundler-audit check` | 脆弱性チェック |

### Frontend (Next.js)

| チェック | コマンド | 説明 |
|---------|---------|------|
| Lint | `docker-compose exec frontend npm run lint` | ESLint チェック |
| 型チェック | `docker-compose exec frontend npm run type-check` | TypeScript 型チェック |
| ビルド | `docker-compose exec frontend npm run build` | プロダクションビルド |
| セキュリティ | `docker-compose exec frontend npm audit` | 脆弱性チェック |

## 🛠️ トラブルシューティング

### Q: Git hooks が動作しない

```bash
# hooks ディレクトリの権限を確認
chmod +x .githooks/pre-commit

# Git hooks を再設定
git config core.hooksPath .githooks
```

### Q: CI が遅い

```bash
# Docker イメージのキャッシュをクリア
docker-compose build --no-cache

# 不要なコンテナ・イメージを削除
docker system prune -a
```

### Q: テストが失敗する

```bash
# データベースをリセット
docker-compose exec backend rails db:reset

# コンテナを再起動
docker-compose restart
```

### Q: Lint エラーを自動修正したい

```bash
# Backend
docker-compose exec backend rubocop -A

# Frontend
docker-compose exec frontend npm run lint:fix
```

## 📝 ワークフロー例

### 通常の開発フロー

```bash
# 1. 変更を加える
vim backend/app/controllers/health_controller.rb

# 2. ローカルで CI チェック（オプション）
./scripts/run-ci-locally.sh backend

# 3. コミット（pre-commit hooks が自動実行）
git add .
git commit -m "Update health controller"

# 4. プッシュ（GitHub Actions が自動実行）
git push origin feature/update-health
```

### Pull Request フロー

1. **ブランチを作成**
   ```bash
   git checkout -b feature/new-feature
   ```

2. **変更を加えてコミット**
   ```bash
   git add .
   git commit -m "Add new feature"
   ```

3. **プッシュ**
   ```bash
   git push origin feature/new-feature
   ```

4. **Pull Request を作成**
   - GitHub で PR を作成
   - CI が自動実行される
   - すべてのチェックが通るまで待つ

5. **マージ**
   - レビュー後、main にマージ

## 💡 ベストプラクティス

1. **コミット前に必ずローカルチェック**
   ```bash
   ./scripts/run-ci-locally.sh all
   ```

2. **小さく頻繁にコミット**
   - CI の実行時間を短縮
   - 問題の特定が容易

3. **エラーはすぐに修正**
   - CI が失敗したらすぐに対応
   - 他の開発者への影響を最小化

4. **セキュリティアラートに注意**
   - 定期的に依存関係を更新
   - 脆弱性は速やかに対応

## 📚 さらに詳しく

- [完全な CI/CD ガイド](CI_SETUP.md)
- [GitHub Actions ドキュメント](https://docs.github.com/actions)
- [Docker ベストプラクティス](https://docs.docker.com/develop/dev-best-practices/)
