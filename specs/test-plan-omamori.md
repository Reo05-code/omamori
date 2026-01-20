# Omamori E2E テストプラン

## Application Overview

Omamori（見守り/作業セッション/安全ログ/リスク判定/アラート）アプリの主要ユーザーフローを対象に、E2E 観点でのテストケースを整理する。想定ユーザーは管理者（admin）と作業者（worker）。フロントは Next.js、バックエンドは API（/api/v1/*）。各シナリオは『初期状態（未ログイン/新規セッション）』から独立して実行できるようにし、正常系・異常系・境界値を含める。

## Test Scenarios

### 1. ナビゲーション/認証

**Seed:** `frontend/e2e/seed.spec.ts`

#### 1.1. ホームが表示される

**File:** `frontend/e2e/auth-home.spec.ts`

**Steps:**
  1. ブラウザの新規コンテキストでアプリの `/` を開く
  2. ページのタイトル/ヘッダが表示されるまで待つ

**Expected Results:**
  - ページがエラーなく表示される
  - タイトルにアプリ名（Omamori）が含まれる

#### 1.2. 未認証でダッシュボードにアクセスした場合の挙動

**File:** `frontend/e2e/auth-guard.spec.ts`

**Steps:**
  1. ブラウザの新規コンテキストで `/dashboard` を開く
  2. 認証状態の判定が完了するまで待つ

**Expected Results:**
  - 未認証の場合、ログイン導線へリダイレクトされる or 未認証向けメッセージが表示される
  - 無限リダイレクトや白画面にならない

#### 1.3. トークン検証 API が失敗した場合のエラー表示

**File:** `frontend/e2e/auth-validate-token-error.spec.ts`

**Steps:**
  1. `/dashboard` を開く
  2. `/api/v1/auth/validate_token` が 500 を返す状況を作る（モック or テスト環境で再現）

**Expected Results:**
  - ユーザーに分かるエラーが表示される（例: 再読み込み/時間をおいて）
  - コンソールに致命的例外が出ない（クラッシュしない）

### 2. 組織（Organizations）

**Seed:** `frontend/e2e/seed.spec.ts`

#### 2.1. 組織一覧が表示される

**File:** `frontend/e2e/org-list.spec.ts`

**Steps:**
  1. 管理者ユーザーでログイン済み状態を用意する（モック or テストユーザー）
  2. `/dashboard` を開く
  3. 組織一覧の表示完了まで待つ

**Expected Results:**
  - 組織が1件以上ある場合、組織名が一覧表示される
  - 0件の場合、空状態（作成導線や説明）が表示される

#### 2.2. 組織を選択してメンバー一覧に遷移できる

**File:** `frontend/e2e/org-select-to-members.spec.ts`

**Steps:**
  1. 管理者ユーザーでログイン済み状態を用意する
  2. 組織一覧から任意の組織を選択する（または URL で `/dashboard/organizations/:id/members` を開く）

**Expected Results:**
  - `/dashboard/organizations/:id/members` が表示される
  - URL の `:id` が選択した組織と一致する

#### 2.3. 存在しない組織IDにアクセスした場合のエラー表示

**File:** `frontend/e2e/org-not-found.spec.ts`

**Steps:**
  1. 管理者ユーザーでログイン済み状態を用意する
  2. 存在しない `:id` の `/dashboard/organizations/:id/members` を開く
  3. 組織取得/メンバー取得 API が 404 を返す状況を作る

**Expected Results:**
  - Not Found 相当の表示、またはユーザーに分かるエラーが表示される
  - クラッシュしない

### 3. メンバー運用（見守り/ステータス/ログ導線）

**Seed:** `frontend/e2e/seed.spec.ts`

#### 3.1. メンバー一覧に運用要素のみが表示される（管理機能が表示されない）

**File:** `frontend/e2e/members-ops-only.spec.ts`

**Steps:**
  1. 管理者ユーザーでログイン済み状態を用意する
  2. `/dashboard/organizations/:id/members` を開く
  3. メンバー行の表示完了まで待つ

**Expected Results:**
  - 各メンバーに『見守り開始/終了』のトグルが表示される
  - 作業ステータス（例: 待機中/見守り中）が表示される
  - ロールは read-only 表示で、ロール変更 UI は存在しない
  - メンバー削除/招待などの管理 UI が存在しない

#### 3.2. 見守り開始→状態反映→見守り終了（正常系）

**File:** `frontend/e2e/members-remote-toggle-happy.spec.ts`

**Steps:**
  1. 管理者ユーザーでログイン済み状態を用意する
  2. `/dashboard/organizations/:id/members` を開く
  3. 対象メンバーの見守りトグルをクリックする
  4. 確認モーダルで『開始』を選択する
  5. 状態が『見守り中』に更新されるのを待つ
  6. 再度トグルをクリックし、確認モーダルで『終了』を選択する

**Expected Results:**
  - 開始APIが成功し、トグルが ON（aria-checked=true）になる
  - 開始後、表示が『見守り中』に更新される
  - 終了APIが成功し、トグルが OFF（aria-checked=false）になる
  - 終了後、表示が『待機中』等に戻る

#### 3.3. 見守り開始API失敗時のエラー表示（異常系）

**File:** `frontend/e2e/members-remote-toggle-error.spec.ts`

**Steps:**
  1. 管理者ユーザーでログイン済み状態を用意する
  2. `/dashboard/organizations/:id/members` を開く
  3. 見守りトグル→確認モーダル『開始』を実行する
  4. 開始APIが 4xx/5xx を返す状況を作る

**Expected Results:**
  - エラーメッセージが表示される（例: 開始に失敗しました）
  - トグルは OFF のまま、二重送信できない状態が解消される（ボタン/トグルが復帰する）
  - 表示ステータスは開始前のまま維持される

#### 3.4. 作業ログ（基本情報）へ遷移できる

**File:** `frontend/e2e/members-to-worklogs.spec.ts`

**Steps:**
  1. 管理者ユーザーでログイン済み状態を用意する
  2. `/dashboard/organizations/:id/members` を開く
  3. 対象メンバーの『作業ログ』リンクをクリックする

**Expected Results:**
  - `/dashboard/organizations/:id/work_logs` に遷移する
  - クエリに `userId` が付与される
  - デフォルトで基本情報タブ（tab=basic 相当）が表示される（タブ指定が無くても基本が選択される）

### 4. 作業ログ（Work Logs）/タブ

**Seed:** `frontend/e2e/seed.spec.ts`

#### 4.1. タブのデフォルトは basic（クエリ無し）

**File:** `frontend/e2e/worklogs-default-tab.spec.ts`

**Steps:**
  1. 管理者ユーザーでログイン済み状態を用意する
  2. `/dashboard/organizations/:id/work_logs?userId=:userId` を開く
  3. タブ表示が安定するまで待つ

**Expected Results:**
  - basic タブが選択状態で表示される
  - 他タブ（safety_logs/risk_assessments）が非選択状態で表示される

#### 4.2. タブ指定が不正値の場合は basic にフォールバック

**File:** `frontend/e2e/worklogs-invalid-tab.spec.ts`

**Steps:**
  1. 管理者ユーザーでログイン済み状態を用意する
  2. `/dashboard/organizations/:id/work_logs?userId=:userId&tab=invalid` を開く

**Expected Results:**
  - basic タブが選択状態になる
  - エラー表示にならない

#### 4.3. 安全ログ（移動履歴）タブが表示できる

**File:** `frontend/e2e/worklogs-safety-logs-tab.spec.ts`

**Steps:**
  1. 管理者ユーザーでログイン済み状態を用意する
  2. `/dashboard/organizations/:id/work_logs?userId=:userId&tab=safety_logs` を開く
  3. 安全ログ取得 API が成功する状況を用意する

**Expected Results:**
  - 安全ログの一覧または地図が表示される
  - 読み込み中→表示完了の状態遷移が分かる（ローディング/スケルトン等）

#### 4.4. リスク判定タブが表示できる

**File:** `frontend/e2e/worklogs-risk-tab.spec.ts`

**Steps:**
  1. 管理者ユーザーでログイン済み状態を用意する
  2. `/dashboard/organizations/:id/work_logs?userId=:userId&tab=risk_assessments` を開く
  3. リスク判定取得 API が成功する状況を用意する

**Expected Results:**
  - リスク判定の一覧が表示される
  - ページネーション/追加読み込みがある場合は操作できる

#### 4.5. 安全ログ/リスク判定 API が失敗した場合のエラーハンドリング

**File:** `frontend/e2e/worklogs-tab-api-error.spec.ts`

**Steps:**
  1. 管理者ユーザーでログイン済み状態を用意する
  2. 各タブを順に開く（safety_logs / risk_assessments）
  3. 該当 API が 401/403/404/500 を返す状況を作る

**Expected Results:**
  - ユーザーに分かるエラーが表示される
  - 他タブへの切り替えで復帰できる（画面が壊れない）

### 5. アラート（管理者）

**Seed:** `frontend/e2e/seed.spec.ts`

#### 5.1. 組織アラート一覧が表示できる（正常系）

**File:** `frontend/e2e/alerts-list.spec.ts`

**Steps:**
  1. 管理者ユーザーでログイン済み状態を用意する
  2. アラート一覧ページ（アプリ内導線 or `/dashboard/organizations/:id/alerts` 相当）へ遷移する
  3. アラート取得 API が成功する状況を用意する

**Expected Results:**
  - アラートが表示される（種別/重要度/ステータス等）
  - 0件の場合は空状態が表示される

#### 5.2. アラートのステータス更新（解決/対応中）

**File:** `frontend/e2e/alerts-update-status.spec.ts`

**Steps:**
  1. 管理者ユーザーでログイン済み状態を用意する
  2. アラート一覧を表示する
  3. 任意のアラートのステータス変更操作を行う（例: resolved へ更新）
  4. 更新 API の完了を待つ

**Expected Results:**
  - 更新 API が成功する
  - 一覧上のステータス表示が更新される
  - 再読み込みしても更新が保持される

#### 5.3. 権限がないユーザーはアラート管理操作ができない

**File:** `frontend/e2e/alerts-permission.spec.ts`

**Steps:**
  1. 非管理者（worker）でログイン済み状態を用意する
  2. アラート一覧ページへアクセスする（導線 or 直URL）

**Expected Results:**
  - 403/未許可の表示、またはメニュー自体が表示されない
  - ステータス更新操作が表示されない/実行できない

### 6. 横断（UX/境界値/回復性）

**Seed:** `frontend/e2e/seed.spec.ts`

#### 6.1. ネットワーク遅延時にローディングが適切に出る

**File:** `frontend/e2e/cross-loading-states.spec.ts`

**Steps:**
  1. 管理者ユーザーでログイン済み状態を用意する
  2. メンバー一覧/作業ログ/アラート一覧など、主要ページを開く
  3. API レスポンスを意図的に遅延させる（モック or テスト環境）

**Expected Results:**
  - ローディング状態が表示され、ユーザーが待機できる
  - 完了後にコンテンツに切り替わる
  - ローディングが消えない/二重表示にならない

#### 6.2. API 401/403 のときにセッション回復（再ログイン）導線がある

**File:** `frontend/e2e/cross-auth-expired.spec.ts`

**Steps:**
  1. ログイン済み状態を用意する
  2. 任意のページを開いた状態で API が 401/403 を返す状況にする（セッション期限切れ相当）

**Expected Results:**
  - ログイン導線へ遷移する or 認証が必要な旨が表示される
  - 以降の操作で無限ループ/白画面にならない

#### 6.3. 主要操作の二重送信防止（見守り開始/終了、アラート更新）

**File:** `frontend/e2e/cross-double-submit.spec.ts`

**Steps:**
  1. 管理者ユーザーでログイン済み状態を用意する
  2. 見守り開始/終了やアラート更新などの操作を実行する
  3. API 完了前に同じボタン/トグルを連打する

**Expected Results:**
  - リクエストが重複送信されない（または安全に抑止される）
  - UI が一貫しており、完了後に操作可能状態へ戻る
