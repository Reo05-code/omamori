#!/bin/bash
set -e

echo "Initializing Rails application..."

# Railsアプリケーションを生成（API mode）
rails new . --api --database=postgresql --skip-git --force

echo "Rails application initialized successfully!"
