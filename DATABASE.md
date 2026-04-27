# DATABASE 完全リファレンス

> CSLINK の Supabase（PostgreSQL）スキーマ・RLS ポリシー・運用クエリの完全リファレンス。
> 編集前に必ずこのドキュメントを参照してください。

---

## 目次

1. [Supabase プロジェクト基本情報](#1-supabase-プロジェクト基本情報)
2. [テーブル一覧](#2-テーブル一覧)
3. [companies テーブル](#3-companies-テーブル)
4. [professionals テーブル](#4-professionals-テーブル)
5. [matchings テーブル](#5-matchings-テーブル)
6. [messages テーブル](#6-messages-テーブル)
7. [admin_users テーブル](#7-admin_users-テーブル)
8. [auth.users（Supabase標準）](#8-authusersSupabase標準)
9. [関数・トリガー](#9-関数トリガー)
10. [Row Level Security（RLS）](#10-row-level-securityrls)
11. [Realtime 設定](#11-realtime-設定)
12. [認証設定](#12-認証設定)
13. [よく使うSQL集](#13-よく使うsql集)
14. [スキーマ変更の手順](#14-スキーマ変更の手順)
15. [バックアップ・リストア](#15-バックアップリストア)

---

## 1. Supabase プロジェクト基本情報

| 項目 | 値 |
|---|---|
| Project ID | `xatjfhleqgubgrnqzxrs` |
| Project URL | `https://xatjfhleqgubgrnqzxrs.supabase.co` |
| Region | `ap-northeast-1`（東京） |
| Plan | Free Tier |
| Dashboard | https://supabase.com/dashboard/project/xatjfhleqgubgrnqzxrs |

### 主なエンドポイント

| 種別 | URL |
|---|---|
| REST API | `https://xatjfhleqgubgrnqzxrs.supabase.co/rest/v1/` |
| Realtime | `wss://xatjfhleqgubgrnqzxrs.supabase.co/realtime/v1/` |
| Auth | `https://xatjfhleqgubgrnqzxrs.supabase.co/auth/v1/` |
| Storage | （未使用） |

### Free Tier の制限
- DB: 500MB
- Auth: MAU 50,000
- Email: 4通/時間 ★ 重要
- Storage: 1GB
- Realtime: 200 同時接続

詳細：https://supabase.com/pricing

---

## 2. テーブル一覧

CSLINKで使用しているテーブル：

| テーブル | スキーマ | 用途 | RLS |
|---|---|---|---|
| `companies` | public | 企業登録情報 | ON |
| `professionals` | public | CSプロ登録情報 | ON |
| `matchings` | public | マッチング履歴 | ON |
| `messages` | public | チャットメッセージ | ON |
| `admin_users` | public | 管理者一覧 | ON |
| `users` | auth | Supabase標準 | （管理外） |

### 関係図

```
auth.users (Supabase管理)
    │
    ├─[1:1]─→ companies      (auth_user_id)
    ├─[1:1]─→ professionals  (auth_user_id)
    └─[1:1]─→ admin_users    (auth_user_id)

companies (1) ───[1:N]─→ matchings ←─[N:1]─── (1) professionals
                              │
                              └─[1:N]─→ messages
```

---

## 3. companies テーブル

### 用途
企業の登録情報を保存。CSプロを探したい企業が登録する。

### カラム

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---|---|---|---|---|
| `id` | uuid | NO | gen_random_uuid() | 主キー |
| `auth_user_id` | uuid | YES | NULL | auth.users への FK（ログイン後紐付け） |
| `name` | text | YES | - | 企業名 |
| `email` | text | YES | - | 担当者メール |
| `industry` | text | YES | - | 業種 |
| `size` | text | YES | - | 企業規模 |
| `challenges` | text | YES | - | 抱えている課題 |
| `budget` | text | YES | - | 予算感 |
| `start_date` | text | YES | - | 開始希望時期 |
| `contact` | text | YES | - | 連絡方法・電話等 |
| `memo` | text | YES | - | 補足メモ |
| `status` | text | YES | 'pending' | ステータス（pending/active/closed） |
| `source` | text | YES | - | 流入元 |
| `created_at` | timestamptz | NO | now() | 作成日時 |
| `updated_at` | timestamptz | NO | now() | 更新日時（トリガー自動更新） |

### インデックス
```sql
companies_auth_user_id_idx  on (auth_user_id)
companies_email_idx         on (email)
```

### 外部キー
- `auth_user_id` → `auth.users(id)` ON DELETE SET NULL

### よくあるクエリ
```sql
-- ログインユーザーの企業情報取得
select * from companies where auth_user_id = auth.uid();

-- pending状態の企業一覧
select id, name, email, challenges, created_at
  from companies
 where status = 'pending'
 order by created_at desc;

-- 業種別カウント
select industry, count(*) from companies
 group by industry order by count(*) desc;
```

---

## 4. professionals テーブル

### 用途
CS人材（個人／企業）の登録情報。

### カラム

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---|---|---|---|---|
| `id` | uuid | NO | gen_random_uuid() | 主キー |
| `auth_user_id` | uuid | YES | NULL | auth.users への FK |
| `name` | text | YES | - | 氏名 |
| `email` | text | YES | - | メール |
| `tel` | text | YES | - | 電話番号 |
| `affiliation` | text | YES | - | 活動形態（個人/法人） |
| `company_name` | text | YES | - | 屋号・会社名 |
| `experience` | text | YES | - | CS経験年数 |
| `role` | text | YES | - | 直近の役職 |
| `industries` | text | YES | - | 経験業界（カンマ区切り） |
| `specialties` | text | YES | - | 得意領域（カンマ区切り） |
| `achievement` | text | YES | - | 実績 |
| `pr` | text | YES | - | 自己PR |
| `worktypes` | text | YES | - | 希望稼働形態 |
| `rate` | text | YES | - | 希望報酬 |
| `hourly` | text | YES | - | 時給 |
| `availability` | text | YES | - | 稼働開始可能時期 |
| `location` | text | YES | - | 勤務場所 |
| `portfolio` | text | YES | - | ポートフォリオURL |
| `memo` | text | YES | - | 補足 |
| `activity` | text | YES | - | 活動形態（一覧表示用） |
| `starttime` | text | YES | - | 開始時期（一覧表示用） |
| `worktype` | text | YES | - | 稼働形態（単数形、一覧表示用） |
| `url` | text | YES | - | 自己URL |
| `ai_score` | int | YES | - | AIスクリーニングスコア |
| `ai_status` | text | YES | - | AI判定（pass/review/hold） |
| `ai_comment` | text | YES | - | AI判定コメント |
| `status` | text | YES | 'pending' | 公開ステータス（pending/approved/rejected） |
| `source` | text | YES | - | 流入元 |
| `created_at` | timestamptz | NO | now() | 作成日時 |
| `updated_at` | timestamptz | NO | now() | 更新日時 |

### インデックス
```sql
professionals_auth_user_id_idx  on (auth_user_id)
professionals_email_idx         on (email)
professionals_status_idx        on (status)
```

### ステータス管理

| status | 意味 | 公開 |
|---|---|---|
| `pending` | 登録直後・運営確認待ち | 非公開 |
| `approved` | 公開OK | **公開**（一覧/詳細ページ） |
| `rejected` | 不採用 | 非公開 |

### よくあるクエリ
```sql
-- 公開中のプロ一覧（list_v2.html が使う）
select id, name, activity, specialties, experience, rate, url
  from professionals
 where status = 'approved'
 order by created_at desc;

-- AIスクリーニング pass のプロ一覧
select id, name, ai_score, status from professionals
 where ai_status = 'pass'
 order by ai_score desc;

-- pending のプロを approved にする
update professionals set status = 'approved'
 where id = '...';
```

---

## 5. matchings テーブル

### 用途
企業とCSプロのマッチング履歴。運営が手動 or AIで作成。

### カラム

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---|---|---|---|---|
| `id` | uuid | NO | gen_random_uuid() | 主キー |
| `company_id` | uuid | YES | - | companies へのFK |
| `professional_id` | uuid | YES | - | professionals へのFK |
| `status` | text | YES | 'proposed' | ステータス |
| `match_score` | int | YES | - | マッチングスコア（0-100） |
| `created_at` | timestamptz | NO | now() | 作成日時 |
| `updated_at` | timestamptz | NO | now() | 更新日時 |

### ステータス遷移
```
proposed → accepted → contracted → closed
       └→ declined
```

| status | 意味 |
|---|---|
| `proposed` | 提案中（運営が作成した直後） |
| `accepted` | 双方OK |
| `declined` | どちらか拒否 |
| `contracted` | 契約成立 |
| `closed` | 案件終了 |

### インデックス
```sql
matchings_company_id_idx       on (company_id)
matchings_professional_id_idx  on (professional_id)
```

### よくあるクエリ
```sql
-- マッチング作成（管理画面）
insert into matchings (company_id, professional_id, status, match_score)
values ('xxx', 'yyy', 'proposed', 85);

-- 企業から見た自分のマッチング
select m.*, p.name as pro_name, p.specialties
  from matchings m
  join professionals p on p.id = m.professional_id
 where m.company_id in (select id from companies where auth_user_id = auth.uid())
 order by m.created_at desc;

-- 月別マッチング数
select date_trunc('month', created_at) as month, count(*)
  from matchings
 group by month order by month desc;
```

---

## 6. messages テーブル

### 用途
matchings に紐づくチャットメッセージ。Realtime対応。

### カラム

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---|---|---|---|---|
| `id` | uuid | NO | gen_random_uuid() | 主キー |
| `matching_id` | uuid | YES | - | matchings へのFK |
| `sender_id` | uuid | YES | - | 送信者の auth.users ID |
| `sender_type` | text | YES | - | 'company' / 'professional' / 'admin' / 'system' |
| `content` | text | YES | - | メッセージ本文 |
| `is_read` | boolean | YES | false | 既読フラグ |
| `created_at` | timestamptz | NO | now() | 送信日時 |

### インデックス
```sql
messages_matching_id_idx  on (matching_id)
messages_created_at_idx   on (created_at)
```

### Realtime 登録
```sql
alter publication supabase_realtime add table public.messages;
```

### よくあるクエリ
```sql
-- 特定マッチングのメッセージ履歴
select * from messages
 where matching_id = '...'
 order by created_at asc;

-- 未読メッセージ数（特定ユーザー）
select count(*) from messages
 where sender_id != 'xxx-user-id'
   and is_read = false
   and matching_id in (
     select id from matchings
     where company_id in (select id from companies where auth_user_id = 'xxx-user-id')
        or professional_id in (select id from professionals where auth_user_id = 'xxx-user-id')
   );
```

---

## 7. admin_users テーブル

### 用途
管理画面（cslink_admin.html）にログイン可能なユーザーを定義。

### カラム

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---|---|---|---|---|
| `id` | uuid | NO | gen_random_uuid() | 主キー |
| `auth_user_id` | uuid | YES | NULL | auth.users への FK |
| `email` | text | YES | - | メアド（重複防止用） |
| `name` | text | YES | - | 表示名 |
| `created_at` | timestamptz | NO | now() | 登録日時 |

### ユニーク制約
```sql
admin_users_auth_user_id_uk  on (auth_user_id)  where auth_user_id is not null
admin_users_email_uk         on (lower(email))   where email is not null
```

### 外部キー
- `auth_user_id` → `auth.users(id)` ON DELETE CASCADE

### 現在の管理者
```sql
select * from admin_users;
```
| email | auth_user_id | name |
|---|---|---|
| kawasaki@facing.co.jp | 15115009-d9c9-4f77-af5f-a372d4696edf | Admin |

### 管理者を追加
```sql
-- 1. 対象者がマジックリンクで一度ログイン（auth.users にレコードができる）
-- 2. 以下を実行
insert into public.admin_users (auth_user_id, email, name)
select id, email, '名前'
  from auth.users
 where email = 'new-admin@example.com'
on conflict do nothing;
```

### 管理者を削除
```sql
delete from public.admin_users where email = 'remove@example.com';
```

---

## 8. auth.users（Supabase標準）

### 用途
Supabase Auth が管理する認証ユーザーテーブル。

### 主なカラム
- `id` (uuid) - 主キー
- `email` - メアド
- `encrypted_password` - 使わない（Magic Link方式）
- `email_confirmed_at` - メール確認日時
- `last_sign_in_at` - 最終ログイン
- `created_at` / `updated_at`

### 直接の編集は推奨しない
基本は **Authentication → Users** UI から操作する。
SQLでの編集は autoincrement / trigger を壊す可能性あり。

### よくある操作

#### 全ユーザー一覧
```sql
select id, email, last_sign_in_at, created_at
  from auth.users
 order by created_at desc;
```

#### ユーザー削除
Dashboard → Authentication → Users → 該当行の「...」→ Delete user
（CASCADE設定により、admin_users も自動削除される）

#### マジックリンク手動送信
Dashboard → Authentication → Users → 該当ユーザー → Send magic link

---

## 9. 関数・トリガー

### `set_updated_at()` 関数
```sql
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end$$;
```

### トリガー
| テーブル | トリガー名 | タイミング |
|---|---|---|
| companies | trg_companies_updated | BEFORE UPDATE |
| professionals | trg_professionals_updated | BEFORE UPDATE |
| matchings | trg_matchings_updated | BEFORE UPDATE |

### `is_admin()` 関数（重要）
```sql
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer       -- SECURITY DEFINER で呼出側権限を超越（admin_users RLSをバイパス）
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users
    where auth_user_id = auth.uid()
  );
$$;

grant execute on function public.is_admin() to anon, authenticated;
```

すべてのテーブルの RLS ポリシーから利用される。

---

## 10. Row Level Security（RLS）

すべての public スキーマのテーブルで RLS が有効。

### companies のポリシー

| ポリシー名 | 操作 | 対象 | 条件 |
|---|---|---|---|
| `companies_anon_insert` | INSERT | anon, authenticated | 常に許可（登録フォーム用） |
| `companies_owner_select` | SELECT | authenticated | 自分の企業 or 未紐付けのemail一致 |
| `companies_owner_update` | UPDATE | authenticated | 自分の企業 or 未紐付けのemail一致 |
| `companies_admin_all` | ALL | authenticated | is_admin() = true |

### professionals のポリシー

| ポリシー名 | 操作 | 対象 | 条件 |
|---|---|---|---|
| `professionals_anon_insert` | INSERT | anon, authenticated | 常に許可 |
| `professionals_public_approved` | SELECT | anon, authenticated | status = 'approved' |
| `professionals_owner_select` | SELECT | authenticated | 自分のプロ or 未紐付けemail一致 |
| `professionals_owner_update` | UPDATE | authenticated | 自分のプロ or 未紐付けemail一致 |
| `professionals_admin_all` | ALL | authenticated | is_admin() |

### matchings のポリシー

| ポリシー名 | 操作 | 対象 | 条件 |
|---|---|---|---|
| `matchings_member_select` | SELECT | authenticated | 関与する企業 or プロ or admin |
| `matchings_member_update` | UPDATE | authenticated | 同上 |
| `matchings_admin_all` | ALL | authenticated | is_admin() |

### messages のポリシー

| ポリシー名 | 操作 | 対象 | 条件 |
|---|---|---|---|
| `messages_member_select` | SELECT | authenticated | 関与する matching のメンバー or admin |
| `messages_member_insert` | INSERT | authenticated | 同上 |
| `messages_admin_all` | ALL | authenticated | is_admin() |

### admin_users のポリシー

| ポリシー名 | 操作 | 対象 | 条件 |
|---|---|---|---|
| `admin_users_self_select` | SELECT | authenticated | 自レコード or admin |
| `admin_users_admin_all` | ALL | authenticated | is_admin() |

### RLS のトラブルシューティング
```sql
-- ポリシー一覧確認
select schemaname, tablename, policyname, cmd, qual
  from pg_policies
 where schemaname = 'public'
 order by tablename, policyname;

-- 特定ユーザーが自分のレコードを見れるかテスト
set role authenticated;
set request.jwt.claims = '{"sub": "USER_UUID", "email": "user@example.com"}';
select * from companies; -- 見えるべきレコードだけ返るか確認
reset role;
```

---

## 11. Realtime 設定

### 有効になっているテーブル
- `messages` のみ

### Realtime publication 確認
```sql
select * from pg_publication_tables where pubname = 'supabase_realtime';
```

### Realtime をクライアントで使う例
```javascript
const channel = supabase
  .channel('messages-XXX')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: 'matching_id=eq.XXX'
  }, (payload) => {
    console.log('new message:', payload.new);
  })
  .subscribe();

// クリーンアップ
supabase.removeChannel(channel);
```

[js/supabase-client.js:176-187](js/supabase-client.js) に実装あり。

---

## 12. 認証設定

Dashboard：https://supabase.com/dashboard/project/xatjfhleqgubgrnqzxrs/auth/url-configuration

### Authentication 設定
- **Provider**: Email のみ有効
- **Email confirmation**: 無効（Magic Link方式）
- **Allow new users to sign up**: 有効

### Site URL
```
https://cslink.link
```

### Redirect URLs（登録済み）
```
https://cslink.link/**
https://cslink.link/cslink_admin.html
https://cslink.link/cslink_mypage_client.html
https://cslink.link/cslink_mypage_pro.html
https://www.cslink.link/**
http://localhost:5500/**
```

### Email Templates
Authentication → Email Templates で日本語化推奨：

#### Magic Link
- 件名：`【CSLINK】ログインリンク`
- 本文例：
```
こんにちは

CSLINKへのログインリンクです：
{{ .ConfirmationURL }}

このリンクは1時間で失効します。
リンクをクリックすると自動でログインされます。

CSLINK運営チーム
https://cslink.link
```

### Rate Limits
Free tier: **4通/時間**
変更不可。回避策：
- Custom SMTP 設定（Resend / SendGrid 連携）
- Pro plan アップグレード

---

## 13. よく使うSQL集

### データ確認系

```sql
-- 全テーブルの行数
select 'companies' as t, count(*) from companies union all
select 'professionals', count(*) from professionals union all
select 'matchings', count(*) from matchings union all
select 'messages', count(*) from messages union all
select 'admin_users', count(*) from admin_users union all
select 'auth.users', count(*) from auth.users;

-- 直近の登録（複数テーブルから時系列）
select 'company' as type, name, email, created_at from companies
union all
select 'pro' as type, name, email, created_at from professionals
order by created_at desc limit 20;

-- 業種別企業数
select industry, count(*) from companies
where industry is not null
group by industry order by 2 desc;

-- ステータス別プロ数
select status, count(*) from professionals
group by status order by 2 desc;
```

### 運用系

```sql
-- プロを approved に
update professionals set status='approved' where id='...';

-- マッチング作成
insert into matchings (company_id, professional_id, status, match_score)
values ('comp-uuid', 'pro-uuid', 'proposed', 85);

-- 管理者追加
insert into admin_users (auth_user_id, email, name)
select id, email, '名前' from auth.users
 where email = 'new@example.com'
 on conflict do nothing;
```

### デバッグ系

```sql
-- 特定ユーザーの権限確認
select id, email from auth.users where email = 'xxx@example.com';
-- → そのIDで auth_user_id 検索
select * from companies where auth_user_id = 'YYY';
select * from professionals where auth_user_id = 'YYY';
select * from admin_users where auth_user_id = 'YYY';

-- 紐付け切れた companies
select id, name, email from companies
where auth_user_id is null;

-- 重複メールチェック
select email, count(*) from professionals
group by email having count(*) > 1;
```

---

## 14. スキーマ変更の手順

### 推奨フロー

1. **migrations/00X_xxx.sql** を新規作成（連番）
2. ローカルで内容確認
3. Supabase ダッシュボード → SQL Editor → New query
4. SQLを貼り付け
5. **Run** をクリック
6. エラー無ければ Git にコミット

### 例：新カラム追加
`migrations/002_add_company_industry_detail.sql`:
```sql
-- 2026-XX-XX 業種詳細カラム追加
alter table public.companies
  add column if not exists industry_detail text;

create index if not exists companies_industry_detail_idx
  on public.companies(industry_detail);
```

### 例：新ポリシー追加
```sql
-- 新規ポリシーは drop policy if exists ... を先に書く（冪等性）
drop policy if exists xxx_policy on public.companies;

create policy xxx_policy on public.companies
  for select to authenticated
  using (...);
```

### 警告：破壊的な変更

以下は **必ず本番投入前にバックアップ**：
- `drop column`
- `alter column type`
- `drop table`
- `truncate`

### スキーマ変更後にやること
- 関連するJS（[js/supabase-client.js](js/supabase-client.js)）を更新
- 関連HTMLの参照箇所を更新
- 動作確認（管理画面・マイページ・公開ページ）

---

## 15. バックアップ・リストア

### Supabase の自動バックアップ
- **Free tier**: なし（手動が必要）
- **Pro tier**: 7日間の Daily backup

### 手動バックアップ方法

#### A. Dashboard から CSV エクスポート
Table Editor → 各テーブル → Export → CSV

#### B. SQL Editor で pg_dump 風エクスポート
```sql
-- 例：companies の中身をJSONとして出力
select json_agg(row_to_json(c)) from companies c;
```
結果を保存。

#### C. CLI（pg_dump）
ローカルに postgresql クライアントが必要：
```bash
pg_dump "postgresql://postgres:PASSWORD@db.xatjfhleqgubgrnqzxrs.supabase.co:5432/postgres" \
  --no-owner --no-privileges \
  > backup_$(date +%Y%m%d).sql
```
パスワードは Dashboard → Settings → Database → Connection string で取得。

### リストア
```bash
psql "postgresql://postgres:PASSWORD@db.xatjfhleqgubgrnqzxrs.supabase.co:5432/postgres" \
  < backup_YYYYMMDD.sql
```

### 重要：定期バックアップを推奨
本番運用に入ったら、**月1回程度** 手動バックアップを取得してDropbox等に保管。

---

最終更新: 2026年4月27日
