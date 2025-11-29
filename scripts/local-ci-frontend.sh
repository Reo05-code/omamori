#./scripts/local-ci-frontend.sh
# 上記のコマンドで実行されるスクリプト
set -e

echo "Running frontend CI checks..."

echo "--- Installing dependencies ---"
docker compose exec frontend npm install

echo "--- Running ESLint ---"
docker compose exec frontend npm run lint

echo "--- Running TypeScript type check ---"
docker compose exec frontend npm run type-check

echo "Frontend CI checks passed!"
