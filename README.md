# CSLINK

CS（カスタマーサクセス）特化のAIマッチングプラットフォーム

🌐 **本番URL**: https://cslink.link
📦 **リポジトリ**: https://github.com/kawasaki-facing/cslink
🏢 **運営**: facing株式会社

---

## 📚 ドキュメント

引き継ぎ・運用関連のすべてが揃っています。順番に読めば全体像が把握できます。

### 必読（引き継ぎ初日）

| 順 | ファイル | 用途 | 所要時間 |
|---|---|---|---|
| 1 | **[README.md](README.md)** | 全体構成（このファイル） | 5分 |
| 2 | **[ONBOARDING.md](ONBOARDING.md)** | 初日の作業順序ガイド | 10分 |
| 3 | **[HANDOFF.md](HANDOFF.md)** | メイン引き継ぎ資料（全項目を網羅） | 30分 |
| 4 | **[CREDENTIALS.md](CREDENTIALS.md)** | クレデンシャル管理ルール | 10分 |
| 5 | **[BRAND.md](BRAND.md)** | ブランド・デザインシステム | 15分 |

### 開発中に参照（リファレンス）

| ファイル | 用途 |
|---|---|
| **[DATABASE.md](DATABASE.md)** | DB完全リファレンス（スキーマ・RLS・SQL集） |
| **[PAGES.md](PAGES.md)** | 全ページの詳細仕様 |
| **[WORKER.md](WORKER.md)** | Cloudflare Worker（AIプロキシ）詳細 |
| **[OPERATIONS.md](OPERATIONS.md)** | 運用タスク手順集（管理者追加・プロ公開等） |
| **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** | トラブル対処集（症状から逆引き） |
| **[DEPLOY_README.md](DEPLOY_README.md)** | 初期セットアップ履歴（実施済み・参考） |
| **[migrations/001_schema.sql](migrations/001_schema.sql)** | 初期DBスキーマ |

---

## 🏗️ 技術スタック

```
ユーザー（ブラウザ）
    ↓
Vercel（静的ホスティング・GitHub main から自動デプロイ）
    ↓
このリポジトリ（HTML + JavaScript）
    ├── Supabase（DB + 認証 + Realtime）
    └── Cloudflare Worker（AI プロキシ）
              ↓
         Anthropic Claude API
```

### 主要サービス

- **ホスティング**: [Vercel](https://vercel.com) - GitHub `main` から自動デプロイ
- **DB / 認証**: [Supabase](https://supabase.com) - PostgreSQL + Row Level Security + Magic Link Auth
- **AIプロキシ**: [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- **AI**: [Anthropic Claude API](https://www.anthropic.com)
- **フロント**: 静的HTML + JavaScript（フレームワーク不使用）

---

## 🚀 クイックスタート（ローカル開発）

```bash
# 1. リポジトリをクローン
git clone https://github.com/kawasaki-facing/cslink.git
cd cslink

# 2. ローカルサーバー起動
python3 -m http.server 5500

# 3. ブラウザで開く
open http://localhost:5500
```

詳細な手順は [ONBOARDING.md](ONBOARDING.md) を参照。

---

## 📝 開発フロー

```bash
# 1. ブランチを切る
git checkout -b feature/new-feature

# 2. 編集 → ローカル確認
python3 -m http.server 5500

# 3. コミット & push
git add .
git commit -m "feat: 新機能追加"
git push origin feature/new-feature

# 4. GitHub で PR 作成 → main にマージ
# 5. Vercel が自動デプロイ（1-2分）
# 6. https://cslink.link で確認
```

---

## 🌐 主要ページ

| ページ | URL | 認証 |
|---|---|---|
| トップ | https://cslink.link/ | 不要 |
| 機能 | /cslink_features_v5.html | 不要 |
| 使い方 | /cslink_howto_fixed.html | 不要 |
| 料金 | /cslink_pricing.html | 不要 |
| CSプロ一覧 | /cslink_list_v2.html | 不要 |
| 企業登録 | /cslink_register_client.html | 不要 |
| プロ登録 | /cslink_register_pro.html | 不要 |
| 企業マイページ | /cslink_mypage_client.html | マジックリンク |
| プロマイページ | /cslink_mypage_pro.html | マジックリンク |
| 管理画面 | /cslink_admin.html | admin権限必要 |
| 会社概要 | /company.html | 不要 |
| 利用規約 | /terms.html | 不要 |
| プライバシー | /privacy.html | 不要 |

詳細は [PAGES.md](PAGES.md) を参照。

---

## 📦 主要ファイル

```
cslink/
├── 📄 README.md / HANDOFF.md / etc.    ドキュメント類
├── 🌐 index.html                        トップ
├── 🌐 cslink_*.html                     機能別ページ群
├── 📁 js/
│   ├── config.js                        環境設定
│   └── supabase-client.js               Supabase ラッパー
├── 📁 migrations/
│   └── 001_schema.sql                   DBスキーマ
├── 📡 worker.js                         Cloudflare Worker
└── 🎨 favicon.svg / ogp.png / etc.      アセット類
```

完全なファイル一覧は [HANDOFF.md](HANDOFF.md#5-リポジトリ構成) 参照。

---

## ⚠️ 重要事項

### 守るべきこと
- ❌ APIキーやサービスロールキーを**絶対に**GitHubにcommitしない
- ❌ 本番DBの破壊的操作（DROP/TRUNCATE）は必ずバックアップ後
- ❌ 削除前にユーザー確認（「これでいいですか？」）
- ✅ 大きな変更は PR でレビュー
- ✅ コミットメッセージは具体的に
- ✅ ローカルで動作確認してから push

### 連絡先

| 用途 | 連絡先 |
|---|---|
| 開発・運用の質問 | 川崎勇樹 / kawasaki@facing.co.jp |
| 運営代表窓口 | facing株式会社 / cs-team@facing.co.jp |
| 電話 | 03-6667-0655 |

---

## 📊 ライセンス・所有

© facing株式会社. All rights reserved.

会社情報：
- 商号：facing株式会社
- 代表：川崎勇樹
- 所在地：〒103-0004 東京都中央区東日本橋2-22-1 クロスシー東日本橋ビル2F
- 労働者派遣事業許可番号：派13-316948
- プライバシーマーク：取得済み（No. 2500202(02)）
