# OPERATIONS 運用タスク手順集

> CSLINK の日常運用で発生するタスクの手順をまとめたドキュメント。
> やりたいことから探してください。

---

## 目次

### 管理者・ユーザー管理
- [新しい管理者を追加する](#新しい管理者を追加する)
- [管理者を削除する](#管理者を削除する)
- [ユーザーアカウントを削除する](#ユーザーアカウントを削除する)

### CSプロ管理
- [新規登録のCSプロを公開する](#新規登録のcsプロを公開する)
- [CSプロを非公開にする](#csプロを非公開にする)
- [CSプロの情報を運営側で修正する](#csプロの情報を運営側で修正する)

### 企業管理
- [企業情報を確認する](#企業情報を確認する)
- [企業のステータスを変更する](#企業のステータスを変更する)

### マッチング管理
- [マッチングを作成する](#マッチングを作成する)
- [マッチングをキャンセルする](#マッチングをキャンセルする)
- [契約成立処理](#契約成立処理)

### コンテンツ更新
- [テキストや画像を修正する](#テキストや画像を修正する)
- [新規ページを追加する](#新規ページを追加する)
- [料金プランを変更する](#料金プランを変更する)
- [ナビゲーションを変更する](#ナビゲーションを変更する)

### システム運用
- [本番デプロイの確認](#本番デプロイの確認)
- [Cloudflare Worker を更新する](#cloudflare-worker-を更新する)
- [Supabase スキーマを変更する](#supabase-スキーマを変更する)
- [DBバックアップを取る](#dbバックアップを取る)

### 外部連携
- [GA4を設定する](#ga4を設定する)
- [Custom SMTP を設定する](#custom-smtp-を設定する)
- [Webhook通知を設定する](#webhook通知を設定する)

---

# 管理者・ユーザー管理

## 新しい管理者を追加する

### 手順

1. **対象者にログインしてもらう**
   - https://cslink.link/cslink_admin.html を開いてもらう
   - メールアドレスを入力 → ログインリンクを送信
   - メールのリンクをクリック → 「権限がありません」と表示される（OK、これで `auth.users` にレコードできた）

2. **Supabase で admin_users に追加**
   - https://supabase.com/dashboard/project/xatjfhleqgubgrnqzxrs/sql/new を開く
   - 以下のSQLを実行（メアドを差し替える）：

```sql
insert into public.admin_users (auth_user_id, email, name)
select id, email, '名前ここ'
  from auth.users
 where email = 'new-admin@example.com'
on conflict do nothing;
```

3. **再ログインを依頼**
   - 対象者に再度マジックリンクログインしてもらう
   - 今度は管理ダッシュボードが開く

### 確認SQL
```sql
select au.email, au.name, au.created_at
  from admin_users au;
```

---

## 管理者を削除する

```sql
delete from public.admin_users
 where email = 'remove@example.com';
```

> ⚠️ 自分自身を削除しないように注意。最後の管理者になっていないか確認。

```sql
-- 削除前に確認
select count(*) from admin_users; -- 1なら削除しない方がいい
```

---

## ユーザーアカウントを削除する

### Supabase Dashboard から
1. Authentication → Users
2. 該当ユーザー行の「...」→ **Delete user**
3. 確認ダイアログで OK

### 関連データの扱い
- `companies.auth_user_id` → SET NULL（レコードは残る）
- `professionals.auth_user_id` → SET NULL（レコードは残る）
- `admin_users` → CASCADE（自動削除）
- `messages.sender_id` → そのまま（手動削除が必要）

### 完全削除のSQL
```sql
-- email から auth_user_id を取得して関連データを削除
do $$
declare
  uid uuid;
begin
  select id into uid from auth.users where email = 'delete@example.com';
  delete from companies where auth_user_id = uid;
  delete from professionals where auth_user_id = uid;
  delete from admin_users where auth_user_id = uid;
  -- auth.users の削除は Dashboard から行う
end$$;
```

---

# CSプロ管理

## 新規登録のCSプロを公開する

### フロー
1. CSプロが `cslink_register_pro.html` から登録（status=`pending`）
2. AIスクリーニング結果を確認
3. 運営判断 → `approved` に変更

### 手順A: 管理画面から
1. https://cslink.link/cslink_admin.html にログイン
2. 「CSプロ一覧」タブ → 該当プロを選択
3. ステータスを `approved` に変更

### 手順B: Supabase Table Editor から
1. Dashboard → Table Editor → `professionals`
2. 該当行の `status` セルをダブルクリック
3. `pending` → `approved` に変更
4. Enter で保存

### 手順C: SQL から
```sql
update professionals
   set status = 'approved'
 where id = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';
```

### 確認
- https://cslink.link/cslink_list_v2.html を開く
- 該当プロが一覧に表示されていればOK

---

## CSプロを非公開にする

```sql
-- 一時的に非表示
update professionals set status = 'pending' where id = '...';

-- 完全に拒否
update professionals set status = 'rejected' where id = '...';
```

> `rejected` でも DB にレコードは残ります。完全削除したい場合は `delete from professionals where id = '...';`

---

## CSプロの情報を運営側で修正する

### Table Editor から
1. Dashboard → Table Editor → `professionals`
2. 該当行のセルを直接編集

### SQL から
```sql
update professionals
   set specialties = '解約防止、LTV改善、CS構築',
       experience = '10年以上'
 where id = '...';
```

> 本人にも反映が伝わるよう、メッセージで通知すると親切。

---

# 企業管理

## 企業情報を確認する

### Table Editor
Dashboard → Table Editor → `companies`

### SQL
```sql
select id, name, industry, challenges, status, created_at
  from companies
 order by created_at desc
 limit 50;
```

### 状態別カウント
```sql
select status, count(*) from companies group by status;
```

---

## 企業のステータスを変更する

```sql
update companies set status = 'active' where id = '...';
```

| status | 意味 |
|---|---|
| `pending` | 確認待ち |
| `active` | 案件募集中 |
| `closed` | 案件終了 |

---

# マッチング管理

## マッチングを作成する

### 手順A: 管理画面（推奨）
1. cslink_admin.html → マッチング作成タブ
2. 企業選択
3. CSプロ選択
4. マッチングスコア入力（任意）
5. 作成 → 双方のマイページに表示される

### 手順B: SQL
```sql
insert into matchings (company_id, professional_id, status, match_score)
values (
  'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',  -- company_id
  'yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy',  -- professional_id
  'proposed',
  85
);
```

---

## マッチングをキャンセルする

```sql
update matchings set status = 'declined' where id = '...';
```

> または完全削除：`delete from matchings where id = '...';`
> 注意：messages も自動削除される（CASCADE想定だが確認）

---

## 契約成立処理

```sql
update matchings set status = 'contracted' where id = '...';
```

その後、運営として契約書送付 → 案件完了時：

```sql
update matchings set status = 'closed' where id = '...';
```

---

# コンテンツ更新

## テキストや画像を修正する

### 手順
1. ローカルでリポジトリを取得：`git pull origin main`
2. 該当HTMLを編集
3. ローカルで確認：`python3 -m http.server 5500`
4. コミット：
```bash
git add .
git commit -m "fix: 料金ページの文言を更新"
git push origin main
```
5. Vercel が自動デプロイ（1-2分）
6. https://cslink.link を強制リロード（`⌘+Shift+R`）して確認

---

## 新規ページを追加する

### 1. 既存ページをコピーして雛形にする
```bash
cp cslink_pricing.html cslink_newpage.html
```

### 2. 必須要素を確認
- `<head>` 内のメタタグ
- フォント読み込み
- supabase-js + config.js + supabase-client.js（DB使う場合）
- ナビゲーション
- フッター

### 3. ナビに追加
**8ページ全部** にナビゲーションを追加：
- index.html
- cslink_features_v5.html
- cslink_howto_fixed.html
- cslink_pricing.html
- cslink_list_v2.html
- cslink_register_client.html
- cslink_register_pro.html
- cslink_mypage_client.html / pro / admin（要ログイン系は別ナビかも）

### 4. sitemap.xml に追加
```xml
<url>
  <loc>https://cslink.link/cslink_newpage.html</loc>
  <lastmod>2026-04-27</lastmod>
  <changefreq>monthly</changefreq>
  <priority>0.7</priority>
</url>
```

### 5. デプロイ → 確認

---

## 料金プランを変更する

### 影響箇所
1. [cslink_pricing.html](cslink_pricing.html) — 料金プラン表
2. [index.html](index.html) — トップの料金紹介セクション
3. [cslink_register_client.html](cslink_register_client.html) — 登録時の料金注釈
4. [cslink_features_v5.html](cslink_features_v5.html) — 機能ページの料金言及

### 手順
1. 上記4ファイルを開く
2. 統一表現で書き換える
3. ローカル確認
4. コミット → push

### 注意
- 商法・特商法の表記準拠を確認
- 既契約者への通知が必要な場合あり

---

## ナビゲーションを変更する

### 手順
全ページのナビ部分を一括編集する。

```bash
# ナビが含まれる要素を grep で探す
grep -l "nav-link" *.html
```

### コツ
- 共通HTMLパーシャルが無いので、**全部手動で同期** が必要
- VS Code の「Find in Files」で一括置換

---

# システム運用

## 本番デプロイの確認

### Vercel ダッシュボード
1. https://vercel.com/[your-team]/cslink を開く
2. **Deployments** タブで最新ビルドを確認
3. ✅ Ready → 成功
4. ❌ Error → ログを見て原因確認

### CLI で確認
```bash
curl -I https://cslink.link/
# → HTTP/2 200 が返ってくればOK
```

### 反映確認
- ブラウザで `⌘+Shift+R`（強制リロード）してから確認
- キャッシュが効いてる場合はシークレットウィンドウで確認

---

## Cloudflare Worker を更新する

### 方法A: Dashboard 手動デプロイ
1. https://dash.cloudflare.com → Workers & Pages
2. `cslink-ai-proxy` を選択
3. **Quick Edit**
4. ローカルの worker.js を全部コピペ
5. **Save and Deploy**

### 方法B: wrangler CLI
```bash
npm install -g wrangler
wrangler login

# 初回のみ wrangler.toml を作成
echo 'name = "cslink-ai-proxy"
main = "worker.js"
compatibility_date = "2025-01-01"' > wrangler.toml

# デプロイ
wrangler deploy
```

### デプロイ確認
```bash
curl https://cslink-ai-proxy.kawasaki-be9.workers.dev/
# → {"ok":true,"service":"CSLINK AI Proxy",...}
```

---

## Supabase スキーマを変更する

### 推奨フロー

1. **migrations/00X_xxxxxx.sql** を新規作成（連番）
2. ローカルで内容確認
3. Supabase ダッシュボード → SQL Editor → New query
4. SQL貼り付け
5. **Run**
6. エラー無ければ Git にコミット

### 例：新カラム追加

`migrations/002_add_company_url.sql`:
```sql
-- 2026-XX-XX 企業のWebサイトURLカラム追加
alter table public.companies
  add column if not exists website_url text;
```

> ⚠️ 破壊的な変更（DROP/ALTER TYPE）は **必ずバックアップから**

---

## DBバックアップを取る

### 方法A: Dashboard CSV エクスポート（簡単）
1. Table Editor → 各テーブル
2. 右上の **Export** → **Download CSV**
3. ファイルを Dropbox / Google Drive 等に保管

### 方法B: SQL Editor で全文ダンプ
```sql
-- 各テーブルの中身をJSON出力
select json_agg(row_to_json(c)) from companies c;
select json_agg(row_to_json(p)) from professionals p;
select json_agg(row_to_json(m)) from matchings m;
select json_agg(row_to_json(msg)) from messages msg;
```
結果をテキストファイルに保存。

### 方法C: pg_dump（要 PostgreSQL クライアント）
```bash
# パスワードは Dashboard → Settings → Database → Connection string で取得
pg_dump "postgresql://postgres:PASSWORD@db.xatjfhleqgubgrnqzxrs.supabase.co:5432/postgres" \
  --no-owner --no-privileges \
  > backup_$(date +%Y%m%d).sql
```

### 推奨頻度
- **本番運用後**: 月1回手動バックアップ
- **重要更新前**: その都度バックアップ

---

# 外部連携

## GA4を設定する

### 手順
1. https://analytics.google.com で GA4 プロパティを作成
2. データストリーム → ウェブ → URL: `https://cslink.link`
3. 測定ID（`G-XXXXXXXXXX`）をコピー
4. [js/config.js](js/config.js) を編集：

```javascript
window.CSLINK_CONFIG = Object.freeze({
  ...
  GA_ID: 'G-XXXXXXXXXX',  // ← 取得したID
  ENABLE_GA: true,         // ← false から true に
  ...
});
```

5. コミット → push → Vercel デプロイ
6. 数分後、GA4 リアルタイムレポートで動作確認

### プライバシー配慮
config.js に `anonymize_ip: true` 設定済み（IPアドレスを匿名化）

---

## Custom SMTP を設定する

### なぜ必要か
Supabase 無料プランは **メール送信 4通/時間制限**。本番運用には不足。
Custom SMTP を設定すれば SendGrid / Resend / Amazon SES 等の上限を使える。

### 推奨：Resend（無料3000通/月）

1. https://resend.com でアカウント作成
2. **API Keys** → 新規作成
3. **Domains** → `cslink.link` を追加 → DNS設定（SPF/DKIM）
4. Supabase Dashboard → **Project Settings → Auth** → SMTP Settings
5. 以下を入力：

| 項目 | 値 |
|---|---|
| Enable Custom SMTP | ON |
| Sender email | `noreply@cslink.link` |
| Sender name | `CSLINK` |
| Host | `smtp.resend.com` |
| Port | `587` |
| Username | `resend` |
| Password | （Resend API Key） |

6. Save → 動作確認（admin画面でログインリクエスト）

### Email Templates も日本語化

Authentication → Email Templates → 各テンプレートを編集：

#### Magic Link
```
件名：【CSLINK】ログインリンク

本文：
こんにちは

CSLINKへのログインリンクです：
{{ .ConfirmationURL }}

このリンクは1時間で失効します。
リンクをクリックすると自動でログインされます。

CSLINK運営チーム
https://cslink.link
```

---

## Webhook通知を設定する

### 用途
新規企業登録 / プロ登録時に Slack / GAS 等に通知。

### 手順

#### Slack の場合
1. Slack で **Incoming Webhook** を追加
2. URLをコピー（`https://hooks.slack.com/services/...`）
3. Cloudflare Dashboard → Workers → `cslink-ai-proxy` → **Variables**
4. **Add Variable**：
   - Name: `NOTIFY_WEBHOOK_URL`
   - Type: Variable（Secretじゃなくていい）
   - Value: 取得したURL
5. **Save**

#### Google Apps Script の場合
1. GAS で Web App を作成
2. `doPost(e)` 関数で `e.postData.contents` をパース
3. デプロイ → URL を取得
4. Worker の `NOTIFY_WEBHOOK_URL` に設定

> Worker は GAS URL を自動検出して `text/plain` ヘッダで送る

### 動作確認
1. 新規プロ登録を試す（テストデータ）
2. Slack/GAS に通知が届くか確認

---

## 緊急対応：本番障害

### サイトが落ちた時
1. https://cslink.link をブラウザで開く
2. エラー → Vercel ダッシュボード → 直近のデプロイ確認
3. デプロイ失敗ならビルドログ確認
4. 直近のコミットでバグった可能性なら **Vercel で前のデプロイにロールバック**：
   - Deployments → 動いていたバージョン → **Promote to Production**
5. ローカルで原因調査 → 修正 → 再デプロイ

### Supabase が止まった時
1. https://status.supabase.com を確認
2. プラットフォーム障害なら待つしかない
3. ログイン不可なら sosial proof として facing 公式 Twitter 等で告知

### Cloudflare Worker が止まった時
1. https://www.cloudflarestatus.com を確認
2. Workers ログでエラーを確認
3. ANTHROPIC_API_KEY が無効化されてないか確認
4. AI機能だけ落ちる → 一時的にチャットボット非表示でしのぐ

---

最終更新: 2026年4月27日
