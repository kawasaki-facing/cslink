# CSLINK デプロイ手順（本番）

CSLINKはCS（カスタマーサクセス）特化AIマッチングプラットフォーム。
静的HTML + Supabase + Cloudflare Workers の3層構成で動作する。

---

## システム構成

```
ブラウザ
  ├── 静的HTML（Cloudflare Pages / GitHub Pages 等）
  │     ├── js/config.js          ← 環境設定
  │     └── js/supabase-client.js ← 認証／データアクセス共通ラッパー
  ├── Supabase（DB / Auth / Realtime）
  │     ├── companies / professionals / matchings / messages / admin_users
  │     └── Row-Level Security で可視範囲を制限
  └── Cloudflare Workers（AIプロキシ）
        ├── POST /chat   - Anthropic APIプロキシ（hero chatbot）
        ├── POST /screen - プロ登録時のAIスクリーニング
        └── POST /register - 任意通知（Supabaseと二重書き込み用・省略可）
```

---

## 1. Supabase セットアップ

### 1-1. プロジェクト作成
- https://supabase.com でプロジェクト作成（Region: `ap-northeast-1 Tokyo` 推奨）
- 現在のプロジェクト: `xatjfhleqgubgrnqzxrs`

### 1-2. スキーマ投入（必須）
1. Supabase ダッシュボード → **SQL Editor** → **New query**
2. `migrations/001_schema.sql` の内容を全文貼り付け
3. **Run** を押して実行
4. 以下が作成される:
   - `auth_user_id` 列を companies / professionals / admin_users に追加
   - RLS ポリシー（本人のみ自データ参照／admin は全操作可）
   - `messages` の Realtime publication 登録
   - `is_admin()` セキュリティ定義関数

### 1-3. Auth 設定
- **Authentication → Providers → Email** を有効化
- **URL Configuration → Site URL** に本番ドメインを登録（例: `https://cslink.link`）
- **Redirect URLs** に以下を追加:
  - `https://cslink.link/cslink_mypage_client.html`
  - `https://cslink.link/cslink_mypage_pro.html`
  - `https://cslink.link/cslink_admin.html`
- **Email Templates** の "Magic Link" の件名・本文を日本語に調整（任意）

### 1-4. 管理者ユーザー登録
管理者にしたいメールアドレスを `admin_users` に紐付ける:

1. `cslink_admin.html` からそのメールでログインリンクを送信 → 本人がクリックして Supabase `auth.users` にレコードを生成
2. SQL Editor で以下を実行（`your-admin@facing.co.jp` を差し替え）:

```sql
insert into public.admin_users (auth_user_id, email, name)
select id, email, 'Admin'
  from auth.users
 where email = 'your-admin@facing.co.jp'
on conflict do nothing;
```

---

## 2. Cloudflare Workers デプロイ

### 2-1. Worker 作成
- Cloudflare ダッシュボード → **Workers & Pages** → **Create Worker**
- 名前: `cslink-ai-proxy`（現行: `cslink-ai-proxy.kawasaki-be9.workers.dev`）
- **Quick Edit** または **wrangler deploy** で `worker.js` の内容を反映
- **Deploy**

### 2-2. 環境変数設定
Worker の **Settings → Variables** で設定:

| 変数名 | 種類 | 必須 | 説明 |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | Secret | ○ | Anthropic のAPIキー（`sk-ant-…`） |
| `NOTIFY_WEBHOOK_URL` | Var | × | 企業／プロ登録時に通知するSlack等のWebhook（未設定なら無通知） |

### 2-3. カスタムドメイン（任意）
- **Settings → Triggers → Custom Domains** で `api.cslink.link` 等を割り当て可
- 割り当てたら `js/config.js` の `WORKER_URL` を書き換え

---

## 3. 静的サイトデプロイ

### 3-1. Cloudflare Pages（推奨）
1. GitHub リポジトリと連携
2. Build command: 空欄（静的HTML直接配信）
3. Build output directory: `/`（ルート）
4. 環境変数: 不要（設定は `js/config.js` 内）

### 3-2. カスタムドメイン
- `cslink.link` を Pages プロジェクトに割り当て
- DNS: Cloudflare 管理下なら自動、外部なら CNAME を pages.dev に向ける

### 3-3. `js/config.js` の編集
本番前に `js/config.js` を確認:

```js
window.CSLINK_CONFIG = Object.freeze({
  SUPABASE_URL: 'https://xatjfhleqgubgrnqzxrs.supabase.co',
  SUPABASE_ANON_KEY: 'eyJ...',              // anon public key（service_role は絶対NG）
  WORKER_URL: 'https://cslink-ai-proxy.kawasaki-be9.workers.dev',
  SITE_ORIGIN: 'https://cslink.link',
  GA_ID: '',                                 // GA4 測定ID（取得後に 'G-XXXXXXXXXX' 形式で入れる）
  ENABLE_GA: false,                          // GA4 を有効にする時のみ true
  ENABLE_SUBSCRIBE: false                    // メルマガ購読フォームを復活させる時のみ true（現状未使用）
});
```

---

## 4. 動作確認チェックリスト

### 公開ページ
- [ ] `/` が 200 を返す
- [ ] `/cslink_list_v2.html` で Supabase の approved なプロが動的表示される
- [ ] `/cslink_pro_detail.html?id=xxx` で該当プロのプロフィールが表示される
- [ ] `/cslink_features_v5.html` のチャットボットが応答する（Anthropic API）

### 登録フォーム
- [ ] `/cslink_register_client.html` 送信 → `companies` にINSERTされる
- [ ] `/cslink_register_pro.html` 送信 → AIスクリーニング結果が返る & `professionals` にINSERTされる

### マイページ / 管理画面
- [ ] `/cslink_mypage_client.html` で登録済みメールにマジックリンクが届く → クリックでログイン成功
- [ ] `/cslink_mypage_pro.html` 同上
- [ ] `/cslink_admin.html` で `admin_users` 登録済みメールのみログイン成功
- [ ] 管理画面から `matchings` / `messages` が操作できる

### セキュリティ
- [ ] 他人の companies / professionals レコードがログイン時に見えない（RLS動作確認）
- [ ] 非adminユーザーが admin.html にアクセスしても弾かれる
- [ ] worker.js の Referer 検証が効いている（許可ドメイン外からは403）

---

## 5. 既知の制約

- `service_role` キーはサーバ側のみ。フロントには置かない
- `js/config.js` の `SUPABASE_ANON_KEY` は公開されるが、RLS により権限は制限されている
- CS プロの検索は現状クライアント側フィルタ。大量データ時は PostgREST の全文検索に切り替え推奨
- Realtime サブスクリプションは messages のみ有効

---

## 6. 運用メモ

### データ投入
- 初期の approved プロ: Supabase ダッシュボード → Table Editor → `professionals` で `status='approved'` に更新
- マッチング作成: `/cslink_admin.html` からも可能、Supabase直接UIからも可

### ファイル構成（主要）
```
├── index.html                    トップ
├── cslink_features_v5.html       機能・チャットボット
├── cslink_howto_fixed.html       使い方・事例
├── cslink_pricing.html           料金
├── cslink_list_v2.html           CSプロ一覧（動的）
├── cslink_pro_detail.html        CSプロ詳細（動的）
├── cslink_register_client.html   企業登録
├── cslink_register_pro.html      プロ登録
├── cslink_mypage_client.html     企業マイページ
├── cslink_mypage_pro.html        プロマイページ
├── cslink_admin.html             運営管理画面
├── company.html / terms.html / privacy.html
├── 404.html
├── js/
│   ├── config.js                 環境設定（GA4/Supabase/Worker URL）
│   └── supabase-client.js        Supabase共通ラッパー
├── migrations/
│   └── 001_schema.sql            初期スキーマ（本番で1度実行）
└── worker.js                     Cloudflare Worker（AIプロキシ）
```

### トラブルシューティング

| 症状 | 原因 | 対処 |
|---|---|---|
| 「CSLINK client unavailable」 | supabase-js 未ロード | `js/config.js` より先に `@supabase/supabase-js@2` CDN を読み込む |
| ログインリンクが届かない | Supabase Email rate limit | Auth の logs を確認、同一IPから過剰送信になってないか |
| admin画面に入れない | admin_users 未登録 or auth_user_id 未リンク | セクション 1-4 の SQL を再実行 |
| マイページで「登録が見つかりません」 | 登録メールとログインメールが違う | 登録時と同じメールでマジックリンクを送る |
| list_v2.html が空 | approved なプロがいない | Table Editor で `professionals.status='approved'` に変更 |
