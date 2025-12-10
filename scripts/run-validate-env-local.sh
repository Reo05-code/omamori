#!/usr/bin/env bash
set -euo pipefail

echo "ローカルで NEXT_PUBLIC_BASE_URL の検証を実行"

# 優先順: 環境変数 -> .env ファイル -> 引数
if [ -n "${1:-}" ]; then
  NEXT_PUBLIC_BASE_URL="$1"
elif [ -n "${NEXT_PUBLIC_BASE_URL:-}" ]; then
  NEXT_PUBLIC_BASE_URL="${NEXT_PUBLIC_BASE_URL}"
elif [ -f ".env" ]; then
  # .env から読み込む（単純パース）
  export $(grep -v '^\s*#' .env | grep NEXT_PUBLIC_BASE_URL || true)
  NEXT_PUBLIC_BASE_URL="${NEXT_PUBLIC_BASE_URL:-}"
fi

if [ -z "${NEXT_PUBLIC_BASE_URL:-}" ]; then
  echo "エラー: NEXT_PUBLIC_BASE_URL が設定されていません。"
  echo "使い方:"
  echo "  1) 環境変数で指定する: export NEXT_PUBLIC_BASE_URL=http://localhost:3000"
  echo "  2) スクリプト引数で渡す: ./scripts/run-validate-env-local.sh http://localhost:3000"
  echo "  3) .env ファイルに NEXT_PUBLIC_BASE_URL=<url> を追加する"
  exit 1
fi

echo "NEXT_PUBLIC_BASE_URL: ${NEXT_PUBLIC_BASE_URL}"
echo "検証 OK"

exit 0
