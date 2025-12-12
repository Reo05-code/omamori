#!/bin/bash
# ./scripts/local-ci.sh
# ローカルでフルCIを回すためのラッパースクリプト
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: ./scripts/local-ci.sh [frontend|backend|all]

  frontend  Run frontend CI checks (calls scripts/local-ci-frontend.sh)
  backend   Run backend CI checks  (calls scripts/local-ci-backend.sh)
  all       Run backend then frontend (default)
USAGE
}

component=${1:-all}

case "$component" in
  frontend)
    echo "== Running frontend CI checks =="
    ./scripts/local-ci-frontend.sh
    ;;
  backend)
    echo "== Running backend CI checks =="
    ./scripts/local-ci-backend.sh
    ;;
  all)
    echo "== Running backend CI checks =="
    ./scripts/local-ci-backend.sh

    echo ""
    echo "== Running frontend CI checks =="
    ./scripts/local-ci-frontend.sh
    ;;
  -h|--help)
    usage
    exit 0
    ;;
  *)
    echo "Unknown target: $component" >&2
    usage
    exit 2
    ;;
esac

echo "\nAll requested CI checks finished."
