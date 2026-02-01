## 技術スタック

### Backend (Rails)
- Ruby 3.2.10
- Rails 7.2 (API mode)
- PostgreSQL 15 + PostGIS
- Devise / Devise Token Auth
- RSpec
- RuboCop / Brakeman / Bundler-audit
- Kaminari
- Resend

### Frontend (Next.js)
- Next.js 14 (App Router)
- React 18 / TypeScript 5
- Tailwind CSS
- Leaflet / React Leaflet
- Jest / Playwright
- ESLint / Prettier

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

