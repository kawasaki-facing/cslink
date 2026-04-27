# TROUBLESHOOTING トラブル対処集

> CSLINK 運用中に発生しやすい問題と解決方法。
> 症状から逆引きできるように整理してあります。

---

## 目次

### サイト全般
- [サイトに繋がらない](#サイトに繋がらない)
- [サイトが古いまま更新されない](#サイトが古いまま更新されない)
- [Vercelデプロイが失敗する](#vercelデプロイが失敗する)

### 認証・ログイン
- [マジックリンクが届かない](#マジックリンクが届かない)
- [otp_expired エラー](#otp_expired-エラー)
- [email rate limit exceeded](#email-rate-limit-exceeded)
- [ログインしても管理画面に入れない](#ログインしても管理画面に入れない)
- [マジックリンクでトップに飛ばされる](#マジックリンクでトップに飛ばされる)
- [www がついた URL に飛ばされる](#wwwがついたurlに飛ばされる)

### CSプロ・企業表示
- [CSプロ一覧が空](#csプロ一覧が空)
- [CSプロ詳細が「見つかりません」](#csプロ詳細が見つかりません)
- [自分の登録情報が見えない](#自分の登録情報が見えない)

### AIチャット・スクリーニング
- [AIチャットが応答しない](#aiチャットが応答しない)
- [AIスクリーニングがエラーになる](#aiスクリーニングがエラーになる)
- [AIが変なことを言う](#aiが変なことを言う)

### 開発・コード
- [CSLINK client unavailable エラー](#cslink-client-unavailable-エラー)
- [TypeError: Cannot read properties of null](#typeerror-cannot-read-properties-of-null)
- [CORSエラー](#corsエラー)
- [Console に SyntaxError](#consoleにsyntaxerror)

### データベース
- [SQL がエラー](#sqlがエラー)
- [RLSで自分のデータが見えない](#rlsで自分のデータが見えない)

---

# サイト全般

## サイトに繋がらない

### 症状
- `cslink.link` が開かない
- `DNS_PROBE_FINISHED_NXDOMAIN` 等のブラウザエラー

### 原因と対処

#### 1. ドメイン契約切れ
- 確認：[whois.com](https://whois.com) で `cslink.link` を検索
- 対処：川崎にドメイン更新依頼

#### 2. Vercel ホスティング停止
- 確認：https://vercel.com/[team]/cslink ダッシュボード
- 対処：プロジェクト復旧、課金状況確認

#### 3. Vercel が停止中
- 確認：https://www.vercel-status.com
- 対処：プラットフォーム障害なら待つ

#### 4. DNSキャッシュの問題（自分だけ）
```bash
# Mac
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder

# Windows
ipconfig /flushdns
```

---

## サイトが古いまま更新されない

### 症状
- コードを push したのに本番サイトが古い

### 原因と対処

#### 1. Vercel デプロイがまだ完了してない
- 確認：Vercel Deployments タブ
- 対処：1〜2分待つ

#### 2. ブラウザキャッシュ
- 対処：強制リロード `⌘+Shift+R`（Mac）/ `Ctrl+Shift+R`（Windows）
- それでもダメ → シークレットウィンドウで確認

#### 3. CDN キャッシュ
- 対処：URL に `?v=123` のパラメータを付けて確認
- それでもダメ → Vercel ダッシュボード → Deployments → 最新を「Redeploy」

#### 4. push がそもそも main じゃない
- 確認：`git log origin/main --oneline -5`
- 対処：正しいブランチに push したか確認

---

## Vercelデプロイが失敗する

### 症状
- Deployments タブで Error 表示
- サイトが更新されない

### 原因と対処

#### ビルドログを見る
1. Vercel Dashboard → Deployments → 失敗したデプロイ
2. **View Build Logs** をクリック
3. 赤いエラーメッセージを探す

#### よくあるエラー

**Error: ENOENT: no such file**
- 原因：参照しているファイルがリポジトリにない
- 対処：`git status` で抜けがないか確認、`git add . && git commit && git push`

**Error: Cannot find module**
- 原因：CSLINK は静的サイトなのでこのエラーは出ないはず
- 出る場合：`vercel.json` に余計な設定が混入している可能性

**Build exceeded maximum duration**
- 原因：ビルドが遅すぎる（CSLINK では発生しないはず）
- 対処：Vercel サポートに連絡

---

# 認証・ログイン

## マジックリンクが届かない

### チェックリスト

- [ ] **送信ボタンを押した後、緑色のメッセージは出たか**
  - 出ていない → ボタンクリックが反応してない、JSエラー確認
  - 出た → メール送信は成功している

- [ ] **メアドのスペルミス無いか**

- [ ] **迷惑メールフォルダに入ってないか**

- [ ] **Gmail の場合：「すべてのメール」も確認**

- [ ] **送信から何分経っているか**
  - 5分以上届かない → rate limit 可能性

- [ ] **同じメアドで何回も送ってないか**
  - 4回/時間で limit に当たる

### 確認SQL（Supabase Logs）
Dashboard → Logs → 検索：「Email rate limit」「sent」等

### 解決策

#### Custom SMTP を設定する
[OPERATIONS.md の Custom SMTP](OPERATIONS.md#custom-smtp-を設定する) 参照

#### 1時間待つ（応急）
無料プランの 4通/時間 制限なので、待つしかない。

---

## `otp_expired` エラー

### 症状
URLに `error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired` が出る

### 原因
1. メール送信から 1時間 以上経過した
2. 同じリンクを 2回以上 クリックした
3. 古いリンク（同じメアドに新しいメールを送ると古いリンクは無効化）

### 対処
1. **新しいマジックリンクを送信**（最新のメールのリンクのみクリック）
2. **5分以内** にクリック
3. **1回だけ** クリック
4. 別ブラウザ／別タブで同時に試さない

---

## `email rate limit exceeded`

### 症状
メール送信ボタンを押した時に「送信に失敗しました: email rate limit exceeded」と表示される

### 原因
Supabase 無料プランの送信制限（4通/時間）を超えた

### 対処

#### 即時：1時間待つ
時計を見て、最後にメール送信を試した時刻 + 1時間 経過まで待つ。

#### 即時：Service Role Key で API 経由（緊急時）
管理者しか使えない方法。Anthropic API key と同じく Service Role Key を使ってマジックリンクをメール送信せず生成：

```bash
curl -X POST "https://xatjfhleqgubgrnqzxrs.supabase.co/auth/v1/admin/generate_link" \
  -H "apikey: SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "magiclink",
    "email": "user@example.com",
    "options": { "redirect_to": "https://cslink.link/cslink_admin.html" }
  }'
```

レスポンスの `action_link` を直接ブラウザで開けばログインできる。

> ⚠️ Service Role Key は強力なので使用後は Reset 推奨。

#### 長期：Custom SMTP 設定
[OPERATIONS.md](OPERATIONS.md#custom-smtp-を設定する) 参照。

---

## ログインしても管理画面に入れない

### 症状
- マジックリンクをクリック → ログイン画面に戻される
- または「このアカウントには管理者権限がありません」エラー

### 原因
`admin_users` テーブルに該当ユーザーが登録されていない

### 確認
```sql
select au.email, au.auth_user_id, au.name,
       u.id as auth_users_id,
       case when au.auth_user_id = u.id then 'OK' else 'NG' end as link
  from admin_users au
  left join auth.users u on u.email = au.email
 where au.email = 'kawasaki@facing.co.jp';
```

| 結果 | 対処 |
|---|---|
| 0行 | 管理者として未登録 → admin_users に INSERT |
| `link = NG` | auth_user_id が紐付いてない → UPDATE |
| `link = OK` | 別の問題（DevTools Console 確認） |

### 対処SQL

#### admin_users 未登録
```sql
insert into admin_users (auth_user_id, email, name)
select id, email, 'Admin' from auth.users where email = 'xxx@example.com'
on conflict do nothing;
```

#### auth_user_id 紐付け修正
```sql
update admin_users
   set auth_user_id = (select id from auth.users where email = admin_users.email)
 where auth_user_id is null;
```

---

## マジックリンクでトップに飛ばされる

### 症状
- メールリンクをクリック → `cslink.link/` （トップ）に飛ばされる
- URLに `error_code=otp_expired` か単に `#access_token=...` が付く

### 原因A: Site URL の設定誤り
Site URL が間違っているとフォールバック先がトップになる。

### 確認
Dashboard → Authentication → URL Configuration → **Site URL**

正解：`https://cslink.link`（www なし、末尾スラッシュなし）

### 原因B: Redirect URLs に該当URLが無い
`https://cslink.link/cslink_admin.html` が許可リストにないとリダイレクト先が Site URL にフォールバック。

### 確認
Redirect URLs に以下が入っているか：
```
https://cslink.link/**
https://cslink.link/cslink_admin.html
https://cslink.link/cslink_mypage_client.html
https://cslink.link/cslink_mypage_pro.html
https://www.cslink.link/**
```

---

## `www` がついた URL に飛ばされる

### 症状
ブラウザバーが `www.cslink.link` になる

### 原因
- Vercel または DNS で `cslink.link` → `www.cslink.link` のリダイレクトが設定されている
- または Site URL が `www.cslink.link` になっている

### 対処

#### Site URL を修正
Dashboard → Authentication → URL Configuration → Site URL を `https://cslink.link`（www なし）に。

#### Redirect URLs に www 版も追加（保険）
```
https://www.cslink.link/**
```

これで両方のURLでログインフローが完結する。

---

# CSプロ・企業表示

## CSプロ一覧が空

### 症状
`cslink_list_v2.html` を開くとプロが1人も表示されない

### 確認
```sql
select count(*) from professionals where status = 'approved';
```

- **0件** → approved なプロがいない
- **1件以上** → 他の問題（ブラウザ Console を確認）

### 対処（0件の場合）
```sql
-- pending のプロを approved に変更
update professionals set status = 'approved' where id = '...';
```

または Table Editor で `status` 列を直接編集。

### 確認（1件以上なのに表示されない）
- DevTools Console を開いてエラー確認
- supabase-js の読み込みに失敗している可能性
- `js/config.js` のSUPABASE_ANON_KEY が間違ってる可能性

---

## CSプロ詳細が「見つかりません」

### 症状
`cslink_pro_detail.html?id=xxx` を開くと「プロフィールが見つかりません」表示

### 原因
1. URL の `id` パラメータが間違っている
2. 該当プロの `status` が `approved` でない
3. RLS で見えない

### 確認
```sql
select id, name, status from professionals where id = 'パラメータのID';
```

| 結果 | 原因 |
|---|---|
| 0行 | id が無効 |
| status='pending' | 公開されていない |
| status='approved' | RLS で弾かれてる（通常起きない） |

### 対処
1. 正しい id を URL に渡す（一覧画面のリンクから飛ぶ）
2. status を `approved` に変更（[OPERATIONS.md](OPERATIONS.md)）

---

## 自分の登録情報が見えない

### 症状
マイページにログインしたのに「登録情報がありません」と表示

### 原因
**登録時のメアド ≠ ログイン時のメアド**

例：登録時に `taro@gmail.com` で登録 → ログイン時に `taro@yahoo.co.jp` でマジックリンク

### 対処A: 自動紐付け（実装済み）
[supabase-client.js の linkCompanyByEmail](js/supabase-client.js) が動くはず。
それでも見えなければ：

### 対処B: 手動紐付け SQL
```sql
update companies
   set auth_user_id = (select id from auth.users where email = 'taro@yahoo.co.jp')
 where email = 'taro@gmail.com';
```

### 対処C: 同じメアドで再ログイン
登録時のメアド（`taro@gmail.com`）で再度マジックリンク送信 → ログイン

---

# AIチャット・スクリーニング

## AIチャットが応答しない

### 症状
- メッセージ送信しても何も返ってこない
- または「すみません、少し混み合っています」が返る

### 確認
1. ブラウザ DevTools → Network タブ
2. `/chat` への POST を確認
3. Status code を見る

| Status | 原因 |
|---|---|
| 200 | レスポンスはある（フォールバックメッセージ） |
| 403 | CORS / Refererエラー |
| 500 | Worker内部エラー |
| network error | Worker URL が間違ってる、Worker停止中 |

### Worker側のログ確認
Cloudflare Dashboard → cslink-ai-proxy → Logs

#### よくある原因
- `ANTHROPIC_API_KEY` 未設定 or 無効
- Anthropic API のレート制限
- Anthropic API 障害

### 対処
1. Cloudflare Dashboard → Worker → Variables → `ANTHROPIC_API_KEY` 確認
2. https://status.anthropic.com で障害確認
3. API key を再発行して設定

---

## AIスクリーニングがエラーになる

### 症状
プロ登録時にスクリーニング判定でエラー

### 確認・対処
基本は AIチャットと同じ。Workerログを確認。

### フォールバック動作
worker.js の `fallbackScreening` 関数が動くので、AIが落ちててもルールベースで判定が返る。
登録自体は完了するはず。

---

## AIが変なことを言う

### 症状
- マークダウン記法（`**` `##` 等）が出力される
- 関係ないことを言う
- 個別の料金やパートナー名を出す

### 原因
- システムプロンプトが効いていない
- ユーザー入力でプロンプトインジェクションされた

### 対処

#### システムプロンプトの強化
[worker.js のhandleChat](worker.js) を編集：
- 「マークダウンを使うな」を強調
- 「これらは絶対のルール」と明記
- 違反例を示す

#### モデルを上位に
`claude-sonnet-4-5` → `claude-opus-4-7` で挙動が改善する場合あり（コスト増）

#### 入力サニタイズ強化
特定キーワードをブロック、長さ制限を厳しく等

---

# 開発・コード

## `CSLINK client unavailable` エラー

### 症状
ブラウザ Console に `[CSLINK] @supabase/supabase-js が未ロードです`

### 原因
スクリプトの読み込み順序が間違っている。`supabase-client.js` が `@supabase/supabase-js` より先に読まれている。

### 対処
HTMLの順序を確認：

```html
<!-- 正しい順序 -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="js/config.js"></script>
<script src="js/supabase-client.js"></script>
```

`<head>` で読むなら全部 `<head>` に入れる。`<body>` 末尾で読むなら全部末尾に。混在すると順序がおかしくなる。

---

## `TypeError: Cannot read properties of null`

### 症状
JSコードで `null` を参照してエラー

### 過去の事例
**2026-04-27**：`showLoginOverlay()` で `pwInput` 要素（存在しない）を参照

```javascript
// バグった行
document.getElementById('pwInput').value = '';
// → null.value で TypeError
```

### 対処パターン

#### A. 不要なコードを削除
要素が存在しないなら、その行を削除する。

#### B. null チェックを入れる
```javascript
const el = document.getElementById('pwInput');
if (el) el.value = '';
```

#### C. オプショナルチェイニング（モダンJS）
```javascript
document.getElementById('pwInput')?.value = '';  // ← これは構文エラーになるので注意
const el = document.getElementById('pwInput');
if (el) el.value = '';  // 安全
```

### デバッグ手順
1. DevTools Console でエラー行をクリック
2. ソースが開く → `null` になっている変数を特定
3. その行で `?.` を入れるか `if` ガードを入れる

---

## CORSエラー

### 症状
```
Access to fetch at 'https://cslink-ai-proxy...' from origin 'http://localhost:5500'
has been blocked by CORS policy
```

### 原因
Worker の `ALLOWED_ORIGINS` に該当 Origin が入っていない

### 対処

#### A. Worker の設定を更新
[worker.js:17-22](worker.js)：
```javascript
const ALLOWED_ORIGINS = [
  'https://cslink.link',
  'https://www.cslink.link',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  // ← 必要なら追加
  'http://localhost:3000',
];
```
保存 → Workers にデプロイ

#### B. ローカル開発用には wrangler dev
```bash
wrangler dev
# → ローカルで Worker が動く（http://localhost:8787）
```

---

## Console に SyntaxError

### 症状
`Uncaught SyntaxError: Unexpected identifier`

### 過去の事例
DevTools のペースト警告で `allow pasting` を貼り付ける必要があったが、実際には文字を入力してEnterする必要があった

### 対処
- ペースト警告が出たら **手で `allow pasting` と入力** → Enter
- 以降のペーストは可能になる

### または
DevTools → Settings（歯車）→ Preferences → 「Disable JavaScript」チェック外す

---

# データベース

## SQL がエラー

### 症状
SQL Editor で `Run` するとエラー赤字

### よくあるエラー

#### `relation "public.xxx" does not exist`
- 原因：テーブル名のtypo
- 対処：`select tablename from pg_tables where schemaname='public';` で確認

#### `column "xxx" does not exist`
- 原因：カラム名のtypo
- 対処：Table Editor でカラム名確認

#### `permission denied for table xxx`
- 原因：anon ロール等で実行している
- 対処：右上の **Role** を `postgres` に変更

#### `new row violates row-level security policy`
- 原因：RLS ポリシーに合わない INSERT
- 対処：ポリシーを確認、Role を `postgres` に切り替え

#### `function public.xxx() does not exist`
- 原因：関数が未作成
- 対処：[migrations/001_schema.sql](migrations/001_schema.sql) を再実行

---

## RLSで自分のデータが見えない

### 症状
ログイン後、`select * from companies` が空配列

### 原因
RLSポリシーで除外されている

### 確認
```sql
-- 自分の auth.uid()
select auth.uid();

-- 自分のレコードがあるか（RLS無視で確認、postgres ロール）
select * from companies where auth_user_id = 'YOUR_UID';
```

### 対処A: auth_user_id を紐付ける
```sql
update companies
   set auth_user_id = (select id from auth.users where email = companies.email)
 where auth_user_id is null and email = 'your@email.com';
```

### 対処B: ポリシーを見直す
[migrations/001_schema.sql](migrations/001_schema.sql) のポリシーを確認、必要なら修正。

---

# その他のヒント

## DevTools の使い方（基本）

### Console
- `⌘+Option+I`（Mac）/ `F12`（Win）で開く
- エラーは赤字
- `console.log()` で変数を出力できる

### Network
- 全HTTPリクエストが見られる
- 失敗したリクエスト、レスポンス内容を確認
- `Preserve log` をONにするとリロード後も残る

### Application
- LocalStorage / Cookies / IndexedDB を見られる
- Supabase セッションは LocalStorage の `cslink-auth` キー

### Sources
- ブレークポイント設定可能
- ステップ実行できる

---

## Slack 通知が来ないとき

1. Slack の Workflow / Incoming Webhook が有効か
2. Worker `NOTIFY_WEBHOOK_URL` が正しいか
3. Worker Logs で `[webhook]` のエラー確認

---

## 検索で出てこないとき

### Google で検索
`site:cslink.link キーワード`

出てこない場合：
- robots.txt で disallow になってないか確認
- sitemap.xml が正しいか
- Google Search Console に登録してインデックス促進

---

## 緊急連絡先

最終手段：
- 川崎勇樹：kawasaki@facing.co.jp
- facing株式会社：cs-team@facing.co.jp / 03-6667-0655

---

最終更新: 2026年4月27日
