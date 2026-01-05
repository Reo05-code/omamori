#./scripts/local-ci-frontend.sh
# 上記のコマンドで実行されるスクリプト
set -e

echo "Running frontend CI checks..."

echo "--- Installing dependencies ---"
docker compose exec frontend npm install

echo "--- Running Prettier check ---"
docker compose exec frontend sh -lc "cd /app && npm run format:check"

echo "--- Running ESLint ---"
docker compose exec frontend npm run lint

echo "--- Running TypeScript type check ---"
docker compose exec frontend npm run type-check

echo "--- Running Jest tests ---"
docker compose exec frontend npm run test

echo "--- Running Playwright E2E tests ---"
docker compose exec frontend npm run test:e2e

echo "Frontend CI checks passed!"
