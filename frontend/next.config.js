/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
}

module.exports = nextConfig

// 開発環境用
// フロントから /api/* へのリクエストをバックエンドの Rails サーバにプロキシします。
// これにより、クロスオリジン制約を回避して Cookie 認証やヘッダー認証がローカルでも正しく動作します。
// 本番環境ではこの設定は不要で、直接バックエンドの URL を叩く形になります。
if (process.env.NODE_ENV === 'development') {
  module.exports = {
    ...module.exports,
    async rewrites() {
      return [
        {
          source: '/api/:path*',
          destination: process.env.BACKEND_URL || 'http://localhost:3001/api/:path*',
        },
      ];
    },
  };
}
