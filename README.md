# CSLINK

CS（カスタマーサクセス）特化のAIマッチングプラットフォーム
本番URL: https://cslink.link

---

## 📚 ドキュメント

引き継ぎ・運用関連の資料は以下を順番に読んでください：

| ファイル | 用途 | 対象 |
|---|---|---|
| **[HANDOFF.md](HANDOFF.md)** | 全体引き継ぎ資料（必読） | 開発者全員 |
| **[ONBOARDING.md](ONBOARDING.md)** | 初日にやることの時系列ガイド | 新規参加者 |
| **[CREDENTIALS.md](CREDENTIALS.md)** | クレデンシャル管理ルール | 開発者全員 |
| **[DEPLOY_README.md](DEPLOY_README.md)** | 本番セットアップ手順（実施済み・履歴用） | 参考 |
| **[migrations/001_schema.sql](migrations/001_schema.sql)** | DBスキーマ定義 | 開発者 |

---

## 技術スタック

- **ホスティング**: Vercel（GitHub `main` から自動デプロイ）
- **DB / 認証**: Supabase（PostgreSQL + Row Level Security + Magic Link Auth）
- **AIプロキシ**: Cloudflare Workers
- **AI**: Anthropic Claude API
- **フロント**: 静的HTML + JavaScript（フレームワーク不使用）

---

## クイックスタート（ローカル開発）

```bash
git clone https://github.com/kawasaki-facing/cslink.git
cd cslink
python3 -m http.server 5500
# http://localhost:5500 で開く
```

詳細は [ONBOARDING.md](ONBOARDING.md) を参照。

---

## ライセンス・所有

© facing株式会社. All rights reserved.

---

## 連絡先

- **管理者**: 川崎勇樹（kawasaki@facing.co.jp）
- **GitHub**: https://github.com/kawasaki-facing/cslink
