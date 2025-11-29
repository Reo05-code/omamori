#!/bin/bash

echo "===================================="
echo "開発環境セットアップスクリプト"
echo "===================================="
echo ""

# コンテナの起動
echo "1. Docker コンテナを起動しています..."
docker-compose up -d

echo ""
echo "2. コンテナの状態を確認しています..."
docker-compose ps

echo ""
echo "3. データベースのセットアップを確認しています..."
docker-compose exec -T backend rails db:create 2>&1 | grep -q "already exists" && echo "✓ データベースは正常に動作しています"

echo ""
echo "===================================="
echo "セットアップ完了!"
echo "===================================="
echo ""
echo "アクセス先:"
echo "  - Frontend: http://localhost:3000"
echo "  - Backend API: http://localhost:3001/health"
echo ""
echo "よく使うコマンド:"
echo "  docker-compose exec backend rspec          # テスト実行"
echo "  docker-compose exec backend rubocop         # Lint チェック"
echo "  docker-compose exec frontend npm run lint   # Frontend Lint"
echo "  docker-compose logs -f backend              # Backend ログ確認"
echo "  docker-compose logs -f frontend             # Frontend ログ確認"
echo ""
