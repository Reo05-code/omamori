#!/bin/bash

# Git hooks のセットアップスクリプト

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🔧 Setting up Git hooks..."

# Git hooks ディレクトリを設定
git config core.hooksPath "$REPO_ROOT/.githooks"

# pre-commit に実行権限を付与
chmod +x "$REPO_ROOT/.githooks/pre-commit"

echo "✅ Git hooks setup complete!"
echo ""
echo "📝 The following hooks are now active:"
echo "  - pre-commit: Runs RuboCop, RSpec, ESLint, and TypeScript checks"
echo ""
echo "💡 To skip hooks, use: git commit --no-verify"
