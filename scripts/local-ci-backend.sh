#./scripts/local-ci-backend.sh
# 上記のコマンドで実行されるスクリプト
set -e

echo "Running backend CI checks..."

echo "--- Installing dependencies ---"
docker compose exec backend bundle install

echo "--- Running RuboCop ---"
docker compose exec backend rubocop

echo "--- Running Brakeman ---"
docker compose exec backend brakeman --no-pager --except EOLRails

echo "--- Running RSpec ---"
docker compose exec backend rspec

echo "Backend CI checks passed!"
