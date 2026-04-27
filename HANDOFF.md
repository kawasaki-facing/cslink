# CSLINK サイト引き継ぎ資料（髙橋さん向け）

> **作成日**: 2026年4月27日
> **作成者**: 川崎勇樹（facing株式会社CEO）
> **後任**: 髙橋さん
>
> 本ドキュメントだけ読めばCSLINKサイトの開発・運用を引き継げるようになっています。
> 不明点があれば川崎までSlack/メールで連絡してください。

---

## 0. まずこれを読んで（5分でわかる全体像）

### CSLINK とは
- **正式名**: CSLINK（シーエスリンク）
- **URL**: https://cslink.link
- **何をするサイトか**: CS（カスタマーサクセス）特化のAIマッチングプラットフォーム
- **ユーザー**: 企業（CSプロを探したい）／CSプロ（企業を探したい）／運営（マッチング管理）
- **収益モデル**: 企業側は完全無料、成約時にCS側から10%手数料

### 技術構成（ざっくり）
```
[ユーザー]
   ↓
[Vercel] ← GitHub main ブランチから自動デプロイ
   ↓
[静的HTML（このリポジトリ）]
   ├── Supabase（DB + ログイン認証）
   └── Cloudflare Worker（AI処理だけ通す）
              ↓
        Anthropic Claude API
```

ポイント：**サーバーサイドのコードは原則無し**。HTML + JavaScript のみ。データはSupabaseに直接INSERT/SELECT。AIだけCloudflare Worker経由でAnthropicを叩く。

---

## 1. 引き継ぎ範囲

### 髙橋さんに引き継ぐもの
- ✅ サイト全体の保守・機能追加・デザイン調整
- ✅ Supabaseのスキーマ変更・データ管理
- ✅ Cloudflare Workerのコード変更
- ✅ 本番デプロイ（GitHub push → Vercel自動）

### 川崎が引き続き持つもの
- 🔒 各種サービスのログインID（川崎のGoogleアカウントで作成）
- 🔒 ドメイン契約（cslink.link）
- 🔒 各種クレデンシャルの最終管理権限
- 📞 ビジネス判断（料金変更、機能要件、コンテンツ等）

### 別途川崎から送るもの
- 📩 CSLINK紹介動画ファイル（`794407556.091184.mp4` 相当のオリジナル）
- 🔑 各種APIキー・パスワード（このドキュメントには記載しない）
- 🔑 Supabase / Cloudflare / Vercel / GitHub のアクセス招待

---

## 2. アカウント／サービス一覧

すべて **川崎のGoogleアカウント** で作成・管理されています。
髙橋さんには各サービスから個別に招待を送るので、ご自身のアカウントで参加してください。

| サービス | 用途 | URL | アクセス方法 |
|---|---|---|---|
| **GitHub** | ソースコード管理 | https://github.com/kawasaki-facing/cslink | リポジトリにCollaborator招待を送る |
| **Vercel** | 静的サイトのホスティング・デプロイ | https://vercel.com | プロジェクトメンバー招待 |
| **Supabase** | DB・認証・ストレージ | https://supabase.com/dashboard/project/xatjfhleqgubgrnqzxrs | Organizationにメンバー招待 |
| **Cloudflare** | AIプロキシWorker | https://dash.cloudflare.com | アカウント共有 or API token発行 |
| **Anthropic** | Claude API（チャットボット用） | https://console.anthropic.com | API keyを別途共有 |
| **ドメイン** | cslink.link 契約 | （川崎管理） | DNS変更が必要なときは川崎に依頼 |

> 💡 **API keyやパスワードは別途、安全な方法（Slack DM・1Password共有など）で送ります。**

---

## 3. ファイル構成

```
cslink/
├── HANDOFF.md                    ★この資料
├── DEPLOY_README.md              本番セットアップ手順（履歴用、すでに完了済み）
├── README.md                     リポジトリ説明（簡素）
│
├── index.html                    トップページ
├── cslink_features_v5.html       機能・チャットボット
├── cslink_howto_fixed.html       使い方・事例
├── cslink_pricing.html           料金
├── cslink_list_v2.html           CSプロ一覧（Supabaseから動的取得）
├── cslink_pro_detail.html        CSプロ詳細
├── cslink_register_client.html   企業登録フォーム
├── cslink_register_pro.html      CSプロ登録フォーム（AIスクリーニング付き）
├── cslink_mypage_client.html     企業マイページ（マジックリンクログイン）
├── cslink_mypage_pro.html        CSプロマイページ
├── cslink_admin.html             運営管理画面（admin_users登録者のみ）
├── company.html                  会社概要
├── terms.html / privacy.html     利用規約・プライバシー
├── 404.html                      404ページ
│
├── js/
│   ├── config.js                 環境設定（Supabase URL/Key、Worker URL等）
│   └── supabase-client.js        Supabase共通ラッパー（auth/data/admin機能）
│
├── migrations/
│   └── 001_schema.sql            Supabase初期スキーマ（投入済み）
│
├── worker.js                     Cloudflare Worker本体（AI proxy）
│
├── images/                       画像アセット
├── blog/  cases/                 静的コンテンツ
└── facing/                       関連サイト用ディレクトリ
```

---

## 4. デプロイの仕組み

### 自動デプロイ
1. GitHub の `main` ブランチに push
2. Vercel が自動で検知してビルド & デプロイ
3. 約1〜2分後に https://cslink.link に反映

### Worker（AIプロキシ）のデプロイ
`worker.js` を変更した場合は別途デプロイが必要：
1. Cloudflare ダッシュボード → Workers & Pages
2. `cslink-ai-proxy` を選択 → **Quick Edit**
3. `worker.js` の内容を貼り付け
4. **Save and Deploy**

> ※ wrangler CLIを使えば`wrangler deploy`一発でいけるが、Macに環境構築が必要

---

## 5. 開発のはじめ方（ローカル）

### 必要なもの
- Mac または Windows PC
- Git
- 好きなコードエディタ（VS Code推奨）
- ブラウザ（Chrome）

### 手順
```bash
# 1. リポジトリをクローン
git clone https://github.com/kawasaki-facing/cslink.git
cd cslink

# 2. ブランチを切る
git checkout -b feature/your-task-name

# 3. ローカルで開く方法（どれか1つ）
# A) Pythonで簡易サーバー
python3 -m http.server 5500
# → http://localhost:5500 でアクセス

# B) VS Code の Live Server拡張
# → 右クリック → Open with Live Server

# 4. 編集 → コミット → push
git add .
git commit -m "変更内容の説明"
git push origin feature/your-task-name

# 5. GitHubでPull Request作成 → mainにマージ → 自動デプロイ
```

### 注意：localhostでSupabase認証を試すとき
`js/config.js` の `SITE_ORIGIN` は本番URLですが、認証リダイレクトには `window.location.origin` が使われるので、
`http://localhost:5500` を **Supabase の Redirect URLs に追加** しないとマジックリンクがエラーになります。

---

## 6. Supabase（DB・認証）の構造

### プロジェクトID
`xatjfhleqgubgrnqzxrs`

### URL
https://supabase.com/dashboard/project/xatjfhleqgubgrnqzxrs

### 主要テーブル

| テーブル | 用途 | 主なカラム |
|---|---|---|
| `companies` | 企業登録情報 | `id`, `auth_user_id`, `company_name`, `email`, `industry`, ... |
| `professionals` | CSプロ登録情報 | `id`, `auth_user_id`, `name`, `email`, `skills`, `status`, ... |
| `matchings` | マッチング履歴 | `id`, `company_id`, `professional_id`, `status`, ... |
| `messages` | チャットメッセージ | `id`, `matching_id`, `sender_id`, `content`, `created_at` |
| `admin_users` | 管理者一覧 | `id`, `auth_user_id`, `email`, `name` |
| `auth.users` | Supabase標準の認証ユーザー | `id`, `email`, ... |

### Row Level Security（RLS）
全テーブルにRLSが有効化されており：
- **企業**: 自分の `companies` レコードのみ閲覧/編集可能
- **CSプロ**: 自分の `professionals` レコードのみ閲覧/編集可能、`approved` ステータスは公開
- **管理者**: 全レコード閲覧/編集可能（`admin_users` テーブルに登録されたauth_user_idのみ）
- **メッセージ**: 自分が関与する `matchings` のメッセージのみ閲覧/送信可能

詳細は [migrations/001_schema.sql](migrations/001_schema.sql) を参照。

### 管理者の追加方法
新しい運営メンバーを管理画面に入れたい場合：

```sql
-- Supabase SQL Editor で実行
insert into public.admin_users (auth_user_id, email, name)
select id, email, '名前'
  from auth.users
 where email = 'new-admin@facing.co.jp'
on conflict do nothing;
```

その後、本人が `https://cslink.link/cslink_admin.html` でマジックリンクログインすればOK。

---

## 7. Cloudflare Worker（AIプロキシ）

### 何をするか
CSLINKのフロントエンドが直接Anthropic APIを叩くと、APIキーがブラウザに露出して悪用されるので、
Cloudflare Workerをプロキシとして経由させて、APIキーをサーバー側に隠してます。

### エンドポイント

| パス | 用途 |
|---|---|
| `POST /chat` | トップページ等のチャットボット応答 |
| `POST /screen` | CSプロ登録時のAIスクリーニング判定 |
| `POST /register` | 企業登録通知（任意のWebhook送信、未使用でもOK） |

### 環境変数（Cloudflare Workers Secrets / Vars）

| 変数名 | 種類 | 必須 | 説明 |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | Secret | ○ | Anthropic APIキー（`sk-ant-...`） |
| `NOTIFY_WEBHOOK_URL` | Var | × | 任意通知用WebhookURL |

### 使用しているAIモデル
worker.js 内で指定：
- `claude-sonnet-4-5` 系（コスト・品質バランス重視）
- 必要に応じて変更可

### Workerの URL
`https://cslink-ai-proxy.kawasaki-be9.workers.dev`

`js/config.js` の `WORKER_URL` で参照されている。

---

## 8. 現在の状態（2026年4月27日時点）

### ✅ 完了済み
- [x] ドメイン取得・Vercel連携・本番公開
- [x] Supabaseセットアップ（テーブル・RLS・トリガー）
- [x] 全画面のSupabase連携実装
- [x] Cloudflare Worker（AIプロキシ）デプロイ
- [x] 管理者ユーザー（kawasaki@facing.co.jp）登録
- [x] Auth Redirect URLs設定
- [x] Site URL: `https://cslink.link`（www なし）に統一
- [x] **管理画面ログインのバグ修正（pwInput null参照エラー）**

### ⏳ 動作確認が残っているもの
- [ ] **管理画面ログインの最終確認**（rate limitで現在ブロック中、1時間後に再試行）
- [ ] マイページ（client/pro）のログイン確認
- [ ] 各テーブルが管理画面で正常に表示されるか

### 🐛 既知の課題
- **メール送信制限**: Supabase無料プランは1時間4通制限。本番運用するなら：
  - **Custom SMTP設定**（Resend / SendGrid 等の連携）が望ましい
  - または **Supabase Pro plan**（$25/月〜）にアップグレード

### 💡 今後の改善候補
- [ ] CSプロ検索の高度化（現状はクライアント側フィルタ、データ多くなったら全文検索化）
- [ ] GA4の本番計測ID設定（現在は `js/config.js` の `GA_ID` が空）
- [ ] OGP画像のページごと最適化
- [ ] 多言語対応（現状日本語のみ）
- [ ] PWA化（オフライン対応）

---

## 9. よくあるタスクの手順

### 9-1. テキスト・画像の修正
1. 該当HTMLファイルを編集
2. `git commit -m "..."` → `git push`
3. Vercelが自動デプロイ（1〜2分）

### 9-2. 新規ページの追加
1. `cslink_xxx.html` のテンプレートとして既存ページをコピー
2. `<script src="js/config.js"></script>` と `<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>` を必ず読み込む
3. ナビゲーションリンクを全HTMLに追加（**8ページ全部**：index, features, howto, pricing, list, register_client, register_pro, mypage系）

### 9-3. テーブルにカラム追加
1. Supabase SQL Editor で `alter table ... add column ...` を実行
2. 必要なら RLS ポリシーを更新
3. フロント側JSで参照箇所を追加

### 9-4. 管理画面で新しい一覧を追加
[cslink_admin.html](cslink_admin.html) のJS末尾あたりの `loadAll()` を編集 + テーブルレンダリング関数を追加。
[js/supabase-client.js](js/supabase-client.js) の `admin` 名前空間にデータ取得関数を追加。

---

## 10. トラブルシューティング

| 症状 | 原因 | 対処 |
|---|---|---|
| Vercelデプロイが失敗 | ビルドエラー | Vercel ダッシュボードのログ確認 |
| マジックリンクでトップに飛ばされる | Redirect URLs未登録 or Site URL誤り | Supabase → Auth → URL Configuration |
| `otp_expired` エラー | リンク期限切れ・使用済み | 新しいマジックリンクを送信（5分以内にクリック・1回だけ） |
| `email rate limit exceeded` | Supabase Email送信制限（4通/時間） | 1時間待つ／Custom SMTP導入 |
| 管理画面で「権限がありません」 | admin_users 未登録 or auth_user_id 未リンク | 第6章のSQLを実行 |
| 「CSLINK client unavailable」 | supabase-js未ロード | `<script>` 読み込み順を確認 |
| list画面が空 | approved なプロが0件 | Table Editor で `professionals.status='approved'` に変更 |
| Workerが500エラー | ANTHROPIC_API_KEY 未設定 or 無効 | Cloudflare Workers Settings → Variables 確認 |

---

## 11. これまでの開発で使ってきたAI

**Claude Code**（Anthropic製、CLIベースのAIコーディングツール）を使って実装してきました。

### 何に使ったか
- HTMLページの新規作成・修正
- Supabaseスキーマ設計・SQL生成
- RLSポリシー設計
- Cloudflare Worker のJS実装
- バグ修正（直近の `pwInput` null参照エラーもこれで対応）
- 引き継ぎドキュメント作成（このファイル）

### 髙橋さんもAIを使う場合
- Claude Code: https://claude.com/claude-code
- Anthropic Claude（Web版）: https://claude.ai
- 課金は川崎側で行うので、必要なら相談ください

---

## 12. 連絡先

困ったらまず川崎まで：
- **Slack**: facing株式会社のワークスペース
- **メール**: kawasaki@facing.co.jp

### facing株式会社 公式情報
詳細は別途送付（会社情報・許可番号等）

---

## 付録A: 直近のコミット履歴

```
6af67c8 管理画面ログイン画面のクラッシュを修正
3884ab6 Merge pull request #1 from kawasaki-facing/claude/determined-shirley-2ebb70
3a749a4 ナビゲーションに「CSプロ一覧」メニューを追加
d16c706 本番品質アップデート：Supabase統合・RLS・全画面実装
87d6a21 Update index.html
e2dc37c Add files via upload
```

## 付録B: 参考ドキュメント

- [DEPLOY_README.md](DEPLOY_README.md) - 本番セットアップの詳細手順（参考用、実施済み）
- [migrations/001_schema.sql](migrations/001_schema.sql) - DBスキーマ定義
- [Supabase公式ドキュメント](https://supabase.com/docs)
- [Cloudflare Workers公式ドキュメント](https://developers.cloudflare.com/workers/)
- [Anthropic API公式ドキュメント](https://docs.anthropic.com)

---

**髙橋さん、よろしくお願いします！**
不明点・困ったことがあればいつでも川崎まで。
