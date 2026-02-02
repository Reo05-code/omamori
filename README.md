## 技術スタック

### Backend (Rails)
- Ruby 3.2.10
- Rails 7.2.3
- PostgreSQL 15 (PostGIS 3.4) + activerecord-postgis-adapter 10.0.1
- pg 1.6.2
- puma 6.6.0
- devise 4.9.4
- devise_token_auth 1.2.6
- RSpec 7.1.1
- RuboCop 1.72.1 / RuboCop Rails 2.30.1 / RuboCop RSpec 3.4.0
- Brakeman 7.1.1
- Bundler-audit 0.9.2
- Kaminari 1.2.2
- Resend 1.0.0
- Sidekiq 8.0.10 / Redis 7 (gem 5.4.1)
- Faraday 2.14.0

### Frontend (Next.js)
- Next.js 14.2.33 (App Router)
- React 18.3.1 / TypeScript 5.9.3
- Tailwind CSS 3.4.19
- Leaflet 1.9.4 / React Leaflet 4.2.1
- Jest 30.2.0 / Playwright 1.57.0
- ESLint 8.57.1 / Prettier 3.3.3
- Lucide React 0.562.0

## DB構成

### テーブル
- users
- organizations
- memberships
- invitations
- work_sessions
- safety_logs
- risk_assessments
- alerts

### 主なリレーション
- organizations 1 - N memberships / invitations / work_sessions
- users 1 - N memberships / work_sessions / invitations(inviter)
- work_sessions 1 - N safety_logs / alerts
- safety_logs 1 - 1 risk_assessments

## 機能一覧

### 認証
- 登録 / ログイン / パスワードリセット / トークン検証

### 組織・メンバー管理（管理者）
- 組織の作成・更新・参照
- メンバー一覧 / 権限管理 / 退出
- 招待の発行・一覧・削除・受諾

### 作業セッション
- 作業開始 / 終了 / キャンセル / 現在セッション取得
- 監視ジョブのスケジュール管理（セッション終了時に予約解除）

### 生存報告（SafetyLog）
- 位置情報 + バッテリー + GPS精度の送信
- Heartbeat / SOS / 元気タッチ（check_in）
- 元気タッチの Undo（一定時間内）

### リスク判定（RiskAssessment）
- スコア / レベル（safe / caution / danger）
- 理由コードの記録（熱 / バッテリー / 長時間停止 / 屋外など）

### アラート（管理者）
- アラート一覧 / ステータス更新
- 組織単位の集計（緊急・未解決など）

### ダッシュボード
- アクティブ作業員数 / アラート / 直近アラート
- 位置マップ
- 作業ログ（基本情報 / 移動履歴 / リスク判定）

### Workerアプリ
- 見守り開始 / 終了
- SOS 送信
- 位置・ホーム地点の登録 / 設定
