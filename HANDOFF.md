# CSLINK 完全引き継ぎドキュメント

> **これ1冊で CSLINK サイトの開発・運用が完全に引き継げます**
>
> **作成日**: 2026年4月27日
> **作成者**: 川崎勇樹（facing株式会社CEO）
> **後任**: 髙橋さん
> **対象期間**: 引き継ぎ後の通常運用フェーズ

---

## 目次

1. [プロジェクト概要](#1-プロジェクト概要)
2. [ビジネスコンテキスト](#2-ビジネスコンテキスト)
3. [技術アーキテクチャ全体像](#3-技術アーキテクチャ全体像)
4. [アカウント・サービス一覧](#4-アカウントサービス一覧)
5. [リポジトリ構成](#5-リポジトリ構成)
6. [全ページ詳細](#6-全ページ詳細)
7. [Supabase 完全ガイド](#7-supabase-完全ガイド)
8. [Cloudflare Worker 完全ガイド](#8-cloudflare-worker-完全ガイド)
9. [認証フロー](#9-認証フロー)
10. [ブランド・デザインシステム](#10-ブランドデザインシステム)
11. [デプロイフロー](#11-デプロイフロー)
12. [ローカル開発環境構築](#12-ローカル開発環境構築)
13. [運用タスク手順集](#13-運用タスク手順集)
14. [トラブルシューティング](#14-トラブルシューティング)
15. [現在の状態と既知の課題](#15-現在の状態と既知の課題)
16. [使用しているAIツール](#16-使用しているaiツール)
17. [付録](#17-付録)

---

## 1. プロジェクト概要

### サービス名
**CSLINK**（シーエスリンク）

### URL
- 本番: https://cslink.link
- リポジトリ: https://github.com/kawasaki-facing/cslink

### キャッチコピー
> 「解約が止まる。CSのプロが、今日つながる。」

### サービス内容
- CS（カスタマーサクセス）特化のAIマッチングプラットフォーム
- 企業がCS課題（解約防止／LTV改善／顧客分析／BPO）をAIに相談すると、最適なCS企業／CS人材を提案する
- 企業側は **完全無料**、成約時にCS（人材／企業）側から **10%手数料** をいただく

### ターゲット
| ユーザー区分 | 何を求めているか |
|---|---|
| **企業** | CSの専門家を探したい／自社CS体制の改善 |
| **CSプロ（個人）** | 自分の経験を活かせる案件を探したい |
| **CS会社** | 自社サービスを必要としている企業に出会いたい |
| **運営（facing）** | 双方をマッチングし、契約成立を支援する |

### 主要機能
1. **AIコンシェルジュチャット**（トップページ）— 課題ヒアリングと簡易提案
2. **企業登録フォーム** — 課題内容や予算等を入力
3. **CSプロ登録フォーム** — AIスクリーニング判定付き
4. **CSプロ一覧／詳細ページ** — 公開（approved 済みのみ）
5. **マイページ**（企業／プロ）— マッチング履歴・メッセージ
6. **管理画面** — 運営側のマッチング管理／メッセージ運用

---

## 2. ビジネスコンテキスト

### 運営会社：facing株式会社

| 項目 | 内容 |
|---|---|
| 商号 | facing株式会社 |
| 代表取締役 | 川崎勇樹（かわさき ゆうき） |
| 創業 | 2021年6月10日 |
| 所在地 | 〒103-0004 東京都中央区東日本橋2-22-1 クロスシー東日本橋ビル2F |
| TEL | 03-6667-0655 |
| Eメール | cs-team@facing.co.jp |
| アクセス | 東日本橋駅 徒歩8分／浅草橋駅 徒歩9分／馬喰町駅 徒歩9分 |
| 事業内容 | CSコンサルティング／営業コンサルティング／BPO運営／労働者派遣 |
| 労働者派遣事業許可番号 | 派13-316948（令和5年11月1日許可） |
| プライバシーマーク | 取得済み（No. 2500202(02)） |

> **注意**：資本金・従業員数は意図的に非公開方針です。company.html や terms.html などには記載しないでください。

### CEO 表記ルール
- 正式表記：「川崎勇樹」
- LP・採用サイト・契約書等では一貫してこの表記を使う

### 代表メールアドレス
- **`cs-team@facing.co.jp`**：CSチーム宛（代表窓口兼用）。個人アドレスではない。
- 個別連絡用：**`kawasaki@facing.co.jp`**（管理画面のadmin）

---

## 3. 技術アーキテクチャ全体像

### 全体図

```
┌─────────────────────────────────────────────────────────┐
│                      ユーザー（ブラウザ）                  │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────┐
│              Vercel（静的ホスティング）                    │
│              cslink.link （DNS/SSL）                      │
│   ├── HTML / CSS / JS（このリポジトリの中身）             │
│   └── GitHub main ブランチから自動デプロイ                │
└────────────────────────┬────────────────────────────────┘
                         │
            ┌────────────┴───────────┐
            │                        │
            ▼                        ▼
┌───────────────────────┐  ┌─────────────────────────────┐
│  Supabase             │  │  Cloudflare Worker          │
│  （DB + Auth）        │  │  （AI プロキシ）             │
│  PostgreSQL           │  │  cslink-ai-proxy            │
│  - companies          │  │  ├── /chat   AIチャット     │
│  - professionals      │  │  ├── /screen AIスクリーニング│
│  - matchings          │  │  └── /register 通知Webhook  │
│  - messages           │  │                              │
│  - admin_users        │  └────────────┬────────────────┘
│  + RLS（権限制御）     │               │
│  + Realtime           │               ▼
│  + Auth (Magic Link)  │  ┌─────────────────────────────┐
└───────────────────────┘  │  Anthropic Claude API       │
                            │  - claude-sonnet-4-5        │
                            │  - claude-haiku-4-5         │
                            └─────────────────────────────┘
```

### 各レイヤーの責務

| レイヤー | 何をするか | 何をしないか |
|---|---|---|
| **静的HTML** | 画面表示・ユーザー入力受付・JS制御 | DBアクセス（Supabase経由） |
| **Vercel** | HTML配信・SSL・自動デプロイ | サーバー処理 |
| **Supabase** | データ永続化・認証・RLS・リアルタイム | AIアクセス |
| **Cloudflare Worker** | AI呼び出し・APIキー保護・CORSプロキシ | データ永続化 |
| **Anthropic API** | チャット応答／スクリーニング判定 | 直接の顧客データ保存 |

### なぜこの構成？

| 選択 | 理由 |
|---|---|
| **静的HTML** | サーバー管理不要、Vercel/Cloudflare Pagesで無料配信、CDNで高速 |
| **Supabase** | 認証＋DB＋Realtime＋RLSが1サービスで揃う、Postgres互換、無料枠あり |
| **Cloudflare Worker** | APIキーをサーバー側に隠蔽、低レイテンシ、無料枠で十分 |
| **Vercel** | GitHub連携で自動デプロイ、cslink.linkを綺麗にホスト |
| **Anthropic Claude** | AIチャット品質が高い、日本語が自然、APIが安定 |

---

## 4. アカウント・サービス一覧

すべて **川崎のGoogleアカウント** で作成・SSO ログインしています。
髙橋さんへは、各サービスから **メンバー招待** を送ります（ご自身のメールアカウントで参加）。

### 主要サービス

| サービス | 用途 | URL | 招待方法 |
|---|---|---|---|
| **GitHub** | ソースコード管理 | https://github.com/kawasaki-facing/cslink | リポジトリ Settings → Collaborators |
| **Vercel** | 静的サイトホスティング & 自動デプロイ | https://vercel.com | Project Settings → Members |
| **Supabase** | DB／認証／Realtime | https://supabase.com/dashboard/project/xatjfhleqgubgrnqzxrs | Organization → Team |
| **Cloudflare** | Worker（AIプロキシ） | https://dash.cloudflare.com | Account → Members |
| **Anthropic** | Claude API | https://console.anthropic.com | API key を別途共有 |
| **ドメイン管理** | cslink.link 取得・更新 | （川崎管理） | 川崎が継続管理 |

### Supabase プロジェクト識別子
- **Project ID**: `xatjfhleqgubgrnqzxrs`
- **Project URL**: `https://xatjfhleqgubgrnqzxrs.supabase.co`
- **Region**: `ap-northeast-1 Tokyo`

### Cloudflare Worker
- **名前**: `cslink-ai-proxy`
- **URL**: `https://cslink-ai-proxy.kawasaki-be9.workers.dev`

### 権限ルール
| サービス | 髙橋さんの権限 |
|---|---|
| GitHub | Maintainer（push可・Issue管理可） |
| Vercel | Member（デプロイ確認可） |
| Supabase | Developer（SQL実行可・スキーマ変更可） |
| Cloudflare | Member（Worker編集可） |
| Anthropic | API key 発行（別個のキーを発行して渡す） |

---

## 5. リポジトリ構成

```
cslink/
│
├── 📄 README.md                    エントリポイント
├── 📄 HANDOFF.md                   ★ このドキュメント（メイン引き継ぎ）
├── 📄 ONBOARDING.md                初日の作業順序ガイド
├── 📄 CREDENTIALS.md               クレデンシャル管理ルール
├── 📄 DATABASE.md                  DB完全リファレンス
├── 📄 PAGES.md                     全ページの詳細仕様
├── 📄 WORKER.md                    Cloudflare Worker 詳細
├── 📄 BRAND.md                     ブランド／デザインシステム
├── 📄 OPERATIONS.md                よくある運用タスクの手順
├── 📄 TROUBLESHOOTING.md           トラブル対処集
├── 📄 DEPLOY_README.md             初期セットアップ履歴（参考）
│
├── 🌐 index.html                   トップページ
├── 🌐 cslink_features_v5.html      機能・チャットボット
├── 🌐 cslink_howto_fixed.html      使い方・事例
├── 🌐 cslink_pricing.html          料金
├── 🌐 cslink_list_v2.html          CSプロ一覧（動的）
├── 🌐 cslink_pro_detail.html       CSプロ詳細
├── 🌐 cslink_register_client.html  企業登録フォーム
├── 🌐 cslink_register_pro.html     CSプロ登録フォーム（AI付き）
├── 🌐 cslink_mypage_client.html    企業マイページ
├── 🌐 cslink_mypage_pro.html       CSプロマイページ
├── 🌐 cslink_admin.html            運営管理画面
├── 🌐 company.html                 会社概要
├── 🌐 terms.html                   利用規約
├── 🌐 privacy.html                 プライバシーポリシー
├── 🌐 404.html                     404 ページ
│
├── 📁 js/
│   ├── config.js                   環境設定（公開キー含む）
│   └── supabase-client.js          Supabase 共通ラッパー
│
├── 📁 migrations/
│   └── 001_schema.sql              初期スキーマ（投入済み）
│
├── 📁 images/                      画像アセット
├── 📁 blog/                        ブログ記事用ディレクトリ
├── 📁 cases/                       事例ページ用ディレクトリ
├── 📁 facing/                      facing株式会社の関連ページ
│
├── 🎨 favicon.svg / .ico           ファビコン（CSロゴ）
├── 🎨 apple-touch-icon.png         iOS用ホーム画面アイコン
├── 🎨 icon-192.png / icon-512.png  PWA用アイコン
├── 🎨 ogp.png / ogp.svg            SNSシェア用OGP画像
├── 🎨 162.jpg / 4typo.jpg          画像素材
├── 🎬 794407556.091184.mp4         紹介動画（別途送付）
│
├── 📡 worker.js                    Cloudflare Worker（AIプロキシ）
├── 📡 sitemap.xml                  サイトマップ
├── 📡 robots.txt                   クローラ制御
```

### ファイル命名規則
- `cslink_*.html` ：CSLINK固有のページ
- `index.html` `terms.html` `privacy.html` ：標準名
- 画像はトピック別ディレクトリに分ける（`images/`, `blog/`, `cases/`）

---

## 6. 全ページ詳細

詳細は [PAGES.md](PAGES.md) を参照。ここでは概要のみ。

| ページ | URL | 認証 | 主機能 |
|---|---|---|---|
| トップ | `/` | 不要 | AIチャット、サービス紹介、CTA |
| 機能 | `/cslink_features_v5.html` | 不要 | 機能詳細、AIチャット |
| 使い方 | `/cslink_howto_fixed.html` | 不要 | 使い方解説、事例 |
| 料金 | `/cslink_pricing.html` | 不要 | 料金プラン説明 |
| CSプロ一覧 | `/cslink_list_v2.html` | 不要 | approved プロの一覧 |
| CSプロ詳細 | `/cslink_pro_detail.html?id=xxx` | 不要 | 個別プロのプロフィール |
| 企業登録 | `/cslink_register_client.html` | 不要 | 企業の登録フォーム |
| プロ登録 | `/cslink_register_pro.html` | 不要 | プロの登録フォーム（AI判定付き） |
| 企業マイページ | `/cslink_mypage_client.html` | マジックリンク | マッチング履歴、チャット |
| プロマイページ | `/cslink_mypage_pro.html` | マジックリンク | 案件一覧、チャット |
| 管理画面 | `/cslink_admin.html` | マジックリンク + admin_users | 全データ管理 |
| 会社概要 | `/company.html` | 不要 | facing株式会社 情報 |
| 利用規約 | `/terms.html` | 不要 | サービス利用規約 |
| プライバシー | `/privacy.html` | 不要 | プライバシーポリシー |
| 404 | `/404.html` | 不要 | エラーページ |

---

## 7. Supabase 完全ガイド

詳細は [DATABASE.md](DATABASE.md) を参照。ここでは概要のみ。

### Dashboard アクセス
👉 https://supabase.com/dashboard/project/xatjfhleqgubgrnqzxrs

### 主要テーブル

| テーブル | 用途 | 主要カラム |
|---|---|---|
| `companies` | 企業登録情報 | id, auth_user_id, name, email, industry, challenges, budget, status |
| `professionals` | CSプロ登録情報 | id, auth_user_id, name, email, specialties, experience, status |
| `matchings` | マッチング | id, company_id, professional_id, status, match_score |
| `messages` | チャット | id, matching_id, sender_id, sender_type, content |
| `admin_users` | 管理者 | id, auth_user_id, email, name |
| `auth.users` | Supabase標準 | id, email, ... |

### Row Level Security（RLS）の方針

- **anon（未ログイン）**: 登録フォームのINSERT、approved プロのSELECT のみ許可
- **authenticated（ログイン済み）**: 自分のレコードのみ参照／編集可能
- **admin**: 全レコードを参照／編集可能（`admin_users` テーブルに登録された auth_user_id のみ）

### `is_admin()` 関数

すべてのテーブルポリシーが利用するヘルパー：
```sql
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1 from public.admin_users
    where auth_user_id = auth.uid()
  );
$$;
```

### Realtime
- `messages` テーブルのみ Realtime publication に登録
- マイページ・管理画面のチャットで新着メッセージをリアルタイム反映

### 認証方式
- **Magic Link**（メールリンクログイン）
- パスワード認証は使わない方針

---

## 8. Cloudflare Worker 完全ガイド

詳細は [WORKER.md](WORKER.md) を参照。ここでは概要のみ。

### Worker URL
`https://cslink-ai-proxy.kawasaki-be9.workers.dev`

### エンドポイント

| パス | メソッド | 用途 | 使用モデル |
|---|---|---|---|
| `/chat` | POST | AIチャット応答 | claude-sonnet-4-5 |
| `/screen` | POST | プロ登録AIスクリーニング | claude-haiku-4-5-20251001 |
| `/register` | POST | 任意Webhook通知 | （AI不使用） |
| `/` | GET | サービス情報 | （ヘルスチェック） |

### 環境変数

| 変数 | 種類 | 必須 | 説明 |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | Secret | ○ | Claude API用 |
| `NOTIFY_WEBHOOK_URL` | Var | × | 任意通知用（Slack/GAS等） |

### CORS / セキュリティ
- 許可Origin：`cslink.link`, `www.cslink.link`, `localhost:5500`
- Refererチェックで CSRF を防御
- 入力サニタイズ（プロンプトインジェクション対策）

---

## 9. 認証フロー

### ログインフロー（マイページ・管理画面共通）

```
1. ユーザーがメアド入力 → 「ログインリンクを送信」クリック
   ↓
2. Supabase が Magic Link メールを送信
   - Subject: "Confirm Your Mail" 等
   - 本文に https://xxxxx.supabase.co/auth/v1/verify?token=xxx&redirect_to=https://cslink.link/cslink_xxx.html のリンク
   ↓
3. ユーザーがメール内リンクをクリック
   ↓
4. Supabase が token を検証 → セッショントークン発行
   ↓
5. リダイレクト：https://cslink.link/cslink_xxx.html#access_token=xxx&refresh_token=xxx
   ↓
6. ページの supabase-js が #access_token を読み取り、localStorage に保存
   ↓
7. JavaScript の onAuthChange ハンドラが SIGNED_IN イベントを受信
   ↓
8. 該当ページの bootstrap 処理が実行（getUser → データ取得 → UI更新）
```

### 重要な設定（Supabase Dashboard）

#### Site URL
```
https://cslink.link
```
※ www なし、末尾スラッシュなし

#### Redirect URLs
```
https://cslink.link/**
https://cslink.link/cslink_admin.html
https://cslink.link/cslink_mypage_client.html
https://cslink.link/cslink_mypage_pro.html
https://www.cslink.link/**
```

> 💡 `www` 付きも入れているのは、Vercelが `cslink.link` → `www.cslink.link` に301リダイレクトする可能性に備えるため。

### 管理画面の追加チェック（cslink_admin.html）

```javascript
// 1. ログイン済みか確認
const user = await window.CSLINK.auth.getUser();
if(!user) { showLoginOverlay(); return; }

// 2. admin_users に登録されているか確認
const isAdmin = await window.CSLINK.admin.isAdmin();
if(!isAdmin) {
  await window.CSLINK.auth.signOut();
  showLoginOverlay();
  showLoginError('このアカウントには管理者権限がありません');
  return;
}

// 3. すべての一覧をロード
hideLoginOverlay();
await loadAll();
```

### Email Rate Limit
- Supabase 無料プラン：**4通／時間**
- 超えた場合 `email rate limit exceeded` エラー
- 解決策：1時間待つ／Custom SMTP導入／Pro plan アップグレード

---

## 10. ブランド・デザインシステム

詳細は [BRAND.md](BRAND.md) を参照。ここでは概要のみ。

### カラーパレット（CSS 変数）
```css
:root {
  --teal: #06b6d4;        /* アクセント・主色 */
  --teal-deep: #0891b2;   /* 濃いティール */
  --navy: #0f2342;        /* 背景・主色 */
  --navy-mid: #1e3a5f;    /* 中間色 */
  --text: #1a2744;        /* テキスト */
  --muted: #64748b;       /* ミュートテキスト */
}
```

### フォント
- **日本語ボディ**: `Zen Kaku Gothic New`
- **英数字・数字**: `Space Grotesk`
- **日本語セリフ（タイトル）**: `Yuji Syuku`

### ロゴ
- ファビコン：`favicon.svg` 定義
- ティールのグラデーション角丸正方形 + 白「CS」文字
- ロゴテキスト：`CS`（白）+ `LINK`（ティール）

### タグライン
> 「解約が止まる。CSのプロが、今日つながる。」

---

## 11. デプロイフロー

### 静的サイト（HTML/JS/CSS）

```
ローカル編集
    ↓
git commit
    ↓
git push origin main
    ↓
Vercel webhook 受信
    ↓
ビルド（静的なのでビルドコマンド無し）
    ↓
本番反映（cslink.link）
所要時間：1〜2分
```

### Cloudflare Worker（worker.js）

worker.js を変更した場合は **手動デプロイが必要**：

#### 方法A：Dashboard から
1. https://dash.cloudflare.com → Workers & Pages
2. `cslink-ai-proxy` を選択
3. **Quick Edit** → コードを貼り付け → **Save and Deploy**

#### 方法B：wrangler CLI（要環境構築）
```bash
npm install -g wrangler
wrangler login
wrangler deploy
```

### Supabase スキーマ変更

`migrations/001_schema.sql` に追記して履歴を残し、**SQL Editor で手動実行**：

1. SQL Editor を開く
2. 追加分のSQLを貼り付け
3. **Run** をクリック
4. エラーが出ないことを確認

> ⚠️ 既存データを壊すDDL（DROP, ALTER COLUMN TYPE等）は **必ずバックアップを取ってから** 実行

---

## 12. ローカル開発環境構築

### 必要なもの
- Mac または Windows
- Git
- VS Code（推奨）または好きなエディタ
- Chrome ブラウザ
- Python3（簡易サーバー用）

### 初回セットアップ
```bash
# リポジトリをクローン
cd ~/Documents
git clone https://github.com/kawasaki-facing/cslink.git
cd cslink

# Git の設定
git config user.name "髙橋XX"
git config user.email "your-email@example.com"
```

### 開発サーバー起動

**A. Python 簡易サーバー（推奨）**
```bash
python3 -m http.server 5500
# → http://localhost:5500
```

**B. VS Code Live Server 拡張**
- 拡張機能「Live Server」をインストール
- `index.html` を右クリック → Open with Live Server

**C. Node.js serve（Node がある場合）**
```bash
npx serve -l 5500
```

### ローカルでの認証テスト

`http://localhost:5500` で Supabase 認証を使うには、**Supabase の Redirect URLs に追加が必要**：

```
http://localhost:5500/**
```

> 既に登録済みなのでそのまま使えるはず。新しい URL/port を使う場合は追加。

### Git ブランチ運用

```bash
# 機能追加時
git checkout -b feature/add-xxx-page

# バグ修正時
git checkout -b fix/login-error

# コミット
git add .
git commit -m "変更内容を簡潔に"

# push
git push origin feature/add-xxx-page

# GitHub上でPull Request作成 → mainにマージ → 自動デプロイ
```

### コミットメッセージ規約

| プレフィックス | 用途 | 例 |
|---|---|---|
| `feat:` | 新機能追加 | `feat: CSプロ検索フィルタを追加` |
| `fix:` | バグ修正 | `fix: ログイン後のリダイレクト崩れ` |
| `docs:` | ドキュメント | `docs: HANDOFF.md 更新` |
| `style:` | デザイン調整 | `style: ボタンの色をティールに` |
| `refactor:` | リファクタ | `refactor: supabase-client を整理` |

> プレフィックスは必須ではないが、付けると履歴が読みやすい。

---

## 13. 運用タスク手順集

詳細は [OPERATIONS.md](OPERATIONS.md) を参照。ここでは代表的なものだけ。

### 13-1. 新しい管理者を追加

1. 対象者に `https://cslink.link/cslink_admin.html` を案内
2. 対象者がマジックリンクでログインを試みる（auth.users にレコードができる）
3. SQL Editor で以下を実行：
```sql
insert into public.admin_users (auth_user_id, email, name)
select id, email, '名前'
  from auth.users
 where email = 'new-admin@example.com'
on conflict do nothing;
```
4. 対象者が再度ログインすると管理画面に入れる

### 13-2. CSプロを公開する

1. CSプロが `cslink_register_pro.html` から登録（status = `pending`）
2. AIスクリーニング結果を確認
3. 管理画面 or Supabase Table Editor で `professionals.status = 'approved'` に更新
4. CSプロ一覧（`cslink_list_v2.html`）に表示される

### 13-3. マッチングを作成

1. 管理画面で「企業」と「CSプロ」を選択
2. マッチングスコアを入力（任意）
3. 作成 → 双方のマイページに表示される
4. メッセージのやり取り開始

### 13-4. テキスト・画像の修正

1. 該当HTMLを編集
2. ローカルで確認（`python3 -m http.server`）
3. `git commit -m "..." && git push`
4. Vercel自動デプロイ（1〜2分）
5. キャッシュクリアして本番確認

---

## 14. トラブルシューティング

詳細は [TROUBLESHOOTING.md](TROUBLESHOOTING.md) を参照。ここではよく起きるものを抜粋。

| 症状 | 原因 | 対処 |
|---|---|---|
| Vercelデプロイが失敗 | ビルドエラー | Vercel ダッシュボードのログ確認 |
| マジックリンクでトップに飛ばされる | Site URL or Redirect URLs 設定誤り | Supabase → Auth → URL Configuration |
| `otp_expired` エラー | リンク期限切れ・使用済み | 新しいリンク（5分以内・1回だけ） |
| `email rate limit exceeded` | 4通/時間制限超過 | 1時間待つ／Custom SMTP導入 |
| 管理画面で「権限がありません」 | admin_users 未登録 | 13-1の SQL を実行 |
| 「CSLINK client unavailable」 | supabase-js 未ロード | `<script>` タグ順序確認 |
| list画面が空 | approved なプロが0件 | Table Editor で status='approved' に更新 |
| Worker が500エラー | ANTHROPIC_API_KEY 未設定 or 無効 | Cloudflare Workers Settings 確認 |
| 管理画面ログイン後 即ログアウト | JS エラーで isAdmin() が落ちる | DevTools Console確認 |
| CSプロ詳細ページが空 | id 不正 or status != approved | URLパラメータと status 確認 |

---

## 15. 現在の状態と既知の課題

### ✅ 完了済み（2026年4月27日時点）

- [x] ドメイン取得（cslink.link）
- [x] Vercel 連携・本番公開
- [x] Supabase セットアップ（テーブル・RLS・トリガー・Realtime）
- [x] 全画面の Supabase 連携実装
- [x] Cloudflare Worker（AIプロキシ）デプロイ
- [x] 管理者ユーザー（kawasaki@facing.co.jp）登録・admin_users 紐付け
- [x] Auth Site URL = `https://cslink.link` 設定
- [x] Auth Redirect URLs 設定（admin/mypage 系）
- [x] **管理画面ログインのバグ修正（pwInput null参照エラー）** ※2026-04-27 修正
- [x] 引き継ぎドキュメント整備

### ⏳ 動作確認が残っているもの

- [ ] 管理画面ログインの最終確認（メール rate limit が解除されたら）
- [ ] マイページ（client/pro）のマジックリンクログイン
- [ ] 各テーブルが管理画面で表示されるか
- [ ] AIチャット（/chat）が応答するか
- [ ] AIスクリーニング（/screen）が動作するか

### 🐛 既知の課題

#### 1. メール送信制限（Supabase 無料プラン）
- **症状**: マジックリンク送信が `email rate limit exceeded` で失敗
- **原因**: 4通/時間の制限
- **長期対策**:
  - **Custom SMTP**（Resend / SendGrid 等）を Supabase に連携
  - または **Supabase Pro plan**（$25/月〜）にアップグレード

#### 2. CSプロ検索が単純フィルタのみ
- **症状**: タグ別／キーワード別の検索が無い
- **対策**: PostgREST の全文検索に切り替え（pgvector も検討）

#### 3. GA4 未設定
- **症状**: アクセス解析できない
- **対策**: GA4 プロパティ作成 → `js/config.js` の `GA_ID` に `G-XXXXXXXXXX` を設定 → `ENABLE_GA: true`

#### 4. OGP画像が固定
- **症状**: SNSシェア時にどのページも同じOGP画像
- **対策**: 各ページに `<meta property="og:image">` を個別設定

#### 5. PWA未対応
- **症状**: スマホのホーム画面に追加してもアプリのように動かない
- **対策**: `manifest.json` 追加 + Service Worker 実装

### 💡 今後の改善候補

| 優先度 | タスク | 概要 |
|---|---|---|
| 高 | Custom SMTP 設定 | メール送信を制限なしに |
| 高 | GA4 計測 | アクセス解析の本番運用 |
| 中 | OGP最適化 | ページ別OGP画像 |
| 中 | CSプロ検索強化 | 全文検索／タグ絞り込み |
| 中 | i18n（英語対応） | 海外CSプロも視野に |
| 低 | PWA化 | オフライン対応・ホーム画面追加 |
| 低 | 通知機能（Web Push） | マッチング通知 |

---

## 16. 使用しているAIツール

### Claude Code（Anthropic製、CLIベースのAIコーディング）
これまでの開発の主要ツール：

#### 何に使ったか
- HTMLページの新規作成・修正
- Supabaseスキーマ設計・SQL生成
- RLSポリシー設計
- Cloudflare Worker のJS実装
- バグ修正（直近の `pwInput` null参照エラーもこれで対応）
- 引き継ぎドキュメント作成（このファイル群）

#### 髙橋さんも使う場合
- Claude Code CLI: https://claude.com/claude-code
- Claude Web: https://claude.ai
- 課金は川崎側で行うので、必要なら相談ください

### Anthropic Claude API（プロダクション内で使用）

| 用途 | 使用箇所 | モデル |
|---|---|---|
| AIコンシェルジュチャット | `worker.js /chat` | `claude-sonnet-4-5` |
| プロ登録 AIスクリーニング | `worker.js /screen` | `claude-haiku-4-5-20251001` |

#### モデル変更の方法
`worker.js` の以下を編集：
```javascript
// /chat
body: JSON.stringify({
  model: 'claude-sonnet-4-5',  // ← ここを変更
  ...
})

// /screen
body: JSON.stringify({
  model: 'claude-haiku-4-5-20251001',  // ← ここを変更
  ...
})
```

最新モデル一覧：https://docs.anthropic.com/claude/docs/models-overview

---

## 17. 付録

### 付録A: ドキュメント一覧（リファレンス）

| ファイル | 用途 |
|---|---|
| [README.md](README.md) | リポジトリのエントリポイント |
| [HANDOFF.md](HANDOFF.md) | ★ このドキュメント |
| [ONBOARDING.md](ONBOARDING.md) | 初日チェックリスト |
| [CREDENTIALS.md](CREDENTIALS.md) | クレデンシャル管理ルール |
| [DATABASE.md](DATABASE.md) | DB完全リファレンス |
| [PAGES.md](PAGES.md) | 各ページの詳細仕様 |
| [WORKER.md](WORKER.md) | Cloudflare Worker 詳細 |
| [BRAND.md](BRAND.md) | ブランド・デザインシステム |
| [OPERATIONS.md](OPERATIONS.md) | 運用タスク手順集 |
| [TROUBLESHOOTING.md](TROUBLESHOOTING.md) | トラブル対処集 |
| [DEPLOY_README.md](DEPLOY_README.md) | 初期セットアップ履歴 |
| [migrations/001_schema.sql](migrations/001_schema.sql) | DBスキーマ定義 |

### 付録B: 直近のコミット履歴

```
84cf1c2 髙橋さん向け引き継ぎドキュメント追加
6af67c8 管理画面ログイン画面のクラッシュを修正
3884ab6 Merge pull request #1 from kawasaki-facing/claude/determined-shirley-2ebb70
3a749a4 ナビゲーションに「CSプロ一覧」メニューを追加
d16c706 本番品質アップデート：Supabase統合・RLS・全画面実装
87d6a21 Update index.html
e2dc37c Add files via upload
```

### 付録C: 外部公式ドキュメント

| サービス | URL |
|---|---|
| Supabase | https://supabase.com/docs |
| Cloudflare Workers | https://developers.cloudflare.com/workers/ |
| Anthropic API | https://docs.anthropic.com |
| Vercel | https://vercel.com/docs |
| GitHub | https://docs.github.com |

### 付録D: 連絡先

#### 川崎（引き継ぎ元）
- 名前：川崎勇樹
- 役職：facing株式会社 代表取締役
- メール：kawasaki@facing.co.jp
- Slack：facing株式会社のワークスペース

#### facing株式会社（会社代表）
- メール：cs-team@facing.co.jp
- TEL：03-6667-0655
- 住所：〒103-0004 東京都中央区東日本橋2-22-1 クロスシー東日本橋ビル2F

---

**髙橋さん、よろしくお願いします！**

不明点・追加ドキュメント希望があればいつでも川崎まで。
このドキュメントは生きています — 髙橋さんが気づいたこと・改善案も追記OKです。
