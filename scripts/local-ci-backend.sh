#!/bin/bash
#./scripts/local-ci-backend.sh
# 上記のコマンドで実行されるスクリプト
set -e

echo "========================================"
echo "Running backend CI checks (local)"
echo "========================================"

echo ""
echo "--- Installing dependencies ---"
docker compose exec backend bundle install

echo ""
echo "--- Running RuboCop ---"
docker compose exec backend bundle exec rubocop

echo ""
echo "--- Running Brakeman ---"
docker compose exec backend bundle exec brakeman --no-pager -q -w2

echo ""
echo "--- Running Bundler Audit ---"
docker compose exec backend bundle exec bundler-audit check --update

echo ""
echo "--- Running RSpec (with CI=true for eager_load) ---"
docker compose exec -e CI=true -e RAILS_ENV=test -e DISABLE_SPRING=1 backend bundle exec rspec

echo ""
echo "========================================"
echo "Backend CI checks passed!"
echo "========================================"
