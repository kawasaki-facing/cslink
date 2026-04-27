# ONBOARDING 髙橋さん オンボーディング手順

> 引き継ぎ初日にやることを時系列で並べました。
> 上から順番にやっていけば CSLINK の開発・運用準備が整います。
> 所要時間：合計2〜3時間（Day 1）+ 1〜2時間（Day 2）

---

## Day 1: アクセス権の取得（1時間）

### Step 1. 川崎から招待メールを受け取る

以下のサービスから招待が届きます。各メールから **Accept** または **Join** をクリック：

- [ ] **GitHub** (kawasaki-facing/cslink リポジトリ)
- [ ] **Vercel** (cslinkプロジェクト)
- [ ] **Supabase** (CS LINK プロジェクト)
- [ ] **Cloudflare** (アカウント or API token)

### Step 2. クレデンシャルを受け取る

川崎から別途、以下を Slack DM や 1Password 経由で送付：

- [ ] **Anthropic API key**（Worker 内で使用）
- [ ] **Supabase service_role key**（緊急時のみ使用）
- [ ] その他必要に応じて

> ⚠️ **絶対にGitHubにcommitしないでください**。すべて環境変数 / シークレット経由で管理。詳細は [CREDENTIALS.md](CREDENTIALS.md) 参照。

---

## Day 1: ローカル環境構築（30分）

### Step 3. リポジトリをクローン

```bash
cd ~/Documents  # 任意の場所
git clone https://github.com/kawasaki-facing/cslink.git
cd cslink
```

### Step 4. Git の設定確認

```bash
git config user.name "髙橋XX"
git config user.email "your-email@example.com"
```

### Step 5. ローカルでサイトを開く

```bash
# Pythonがあれば（Macは標準でPython3入ってる）
python3 -m http.server 5500

# ブラウザで以下を開く
# http://localhost:5500
```

トップページが表示されれば成功！

> 💡 ログイン機能（マイページ・管理画面）はローカルでもSupabaseに繋がるが、本番DBを触ることになるので**読み取り専用の動作確認**にとどめる。書き込みテストは管理画面 or テスト用アカウントで。

### Step 6. VS Code で開く（推奨）

```bash
code .
```

VS Code が無い場合：https://code.visualstudio.com/ からダウンロード

#### 推奨拡張機能
- **Live Server**（HTML を即時プレビュー）
- **Prettier**（コード整形）
- **GitLens**（Git履歴を見やすく）
- **Japanese Language Pack**（日本語化）

---

## Day 1: 必読ドキュメントを読む（1時間）

### Step 7. 順番に読んでください

1. **[README.md](README.md)** ← 全体構成（5分）
2. **[HANDOFF.md](HANDOFF.md)** ← メイン引き継ぎ（30分）
3. **[CREDENTIALS.md](CREDENTIALS.md)** ← クレデンシャル管理（10分）
4. **[BRAND.md](BRAND.md)** ← デザインシステム（10分）

> ★は必読。残りは必要時に参照。

### 後で読む（必要に応じて）
- [DATABASE.md](DATABASE.md) - DBスキーマ詳細
- [PAGES.md](PAGES.md) - 各ページの仕様
- [WORKER.md](WORKER.md) - Cloudflare Worker詳細
- [OPERATIONS.md](OPERATIONS.md) - 運用タスク手順
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - トラブル対処

---

## Day 2: 各サービスの管理画面を見る（1時間）

### Step 8. GitHub を見る

https://github.com/kawasaki-facing/cslink

- [ ] コミット履歴をざっと見る
- [ ] Issues / Pull Requests の有無を確認
- [ ] ブランチ一覧（基本は `main` のみ）
- [ ] Settings → Collaborators で自分が入ってるか確認

### Step 9. Vercel を見る

https://vercel.com/[your-team]/cslink

- [ ] **Deployments** で直近のビルド状況を確認
- [ ] **Domains** で `cslink.link` がproductionに紐づいているか確認
- [ ] **Settings → Environment Variables**：基本は空（`js/config.js` で完結）
- [ ] **Settings → Git** でリポジトリ連携を確認

### Step 10. Supabase を見る

https://supabase.com/dashboard/project/xatjfhleqgubgrnqzxrs

#### 確認項目

- [ ] **Authentication → Users** で登録ユーザー一覧を見る
- [ ] **Authentication → URL Configuration** で Site URL / Redirect URLs を確認
  - Site URL: `https://cslink.link`（www なし）
  - Redirect URLs: `https://cslink.link/**` 等が登録されているか
- [ ] **Table Editor** で各テーブルの中身を確認：
  - `companies` / `professionals` / `matchings` / `messages` / `admin_users`
- [ ] **SQL Editor** で簡単なSELECTを試す：

```sql
select count(*) from companies;
select count(*) from professionals;
select * from admin_users;
```

- [ ] **Authentication → Logs** でエラーが発生してないか確認

### Step 11. Cloudflare Workers を見る

https://dash.cloudflare.com → Workers & Pages → `cslink-ai-proxy`

- [ ] **Settings → Variables** で以下が設定されているか確認：
  - `ANTHROPIC_API_KEY`（Secret、値は `••••••` 表示）
  - `NOTIFY_WEBHOOK_URL`（Var、設定有無は任意）
- [ ] **Logs** タブで直近のリクエストログを確認
- [ ] **Triggers** で Routes（カスタムドメインの有無）

### Step 12. Anthropic Console を見る

https://console.anthropic.com

- [ ] **Usage** ページで使用量・コストを確認
- [ ] **API Keys** ページで CSLINK 用のキーを確認

---

## Day 2: 試しに小さい変更をしてみる（30分）

### Step 13. テスト変更

トップページのフッターに更新日表示を追加してみる：

```bash
# 1. ブランチを切る
git checkout -b test/footer-update

# 2. index.html のフッター部分を編集
# （好きな場所に <small>Last updated: 2026-04-27</small> を追加）

# 3. ローカルで動作確認
python3 -m http.server 5500
# → http://localhost:5500 でフッターを確認

# 4. コミット & push
git add index.html
git commit -m "test: フッター更新日表示テスト"
git push origin test/footer-update

# 5. GitHubでPR作成 → mainにマージ
# https://github.com/kawasaki-facing/cslink/compare/main...test/footer-update

# 6. Vercelで自動デプロイ確認（1-2分）
# 7. https://cslink.link で反映確認
```

### Step 14. テスト変更を元に戻す

```bash
git checkout main
git pull origin main

# 元に戻すブランチ
git checkout -b revert/footer-update
# index.html を元に戻す（Last updated を消す）
git add index.html
git commit -m "revert: フッターテストを元に戻す"
git push origin revert/footer-update
# 同じくPR → マージ
```

---

## Day 2: 実際の運用タスクを試す（30分）

### Step 15. テストデータでマッチング作成

1. Supabase Table Editor → `professionals` を開く
2. テスト用プロを1件 INSERT（または既存の pending を流用）
3. `status='approved'` に変更
4. https://cslink.link/cslink_list_v2.html で表示確認

### Step 16. 管理画面で操作

1. https://cslink.link/cslink_admin.html にログイン（自分のアカウントを admin に登録してから）
2. 各タブを開いて表示を確認
3. テストマッチングを作成 → 削除

> ⚠️ 本番データなので、**操作後は必ず元の状態に戻す**

---

## Day 3〜: 引き継ぎ完了

### Step 17. 川崎との同期ミーティング

- [ ] ローカル環境構築完了
- [ ] 各サービスにアクセスできた
- [ ] ドキュメントの不明点を解消
- [ ] 今後のタスク優先順位確認
- [ ] 緊急連絡フローの確認

### Step 18. 最初のタスクを受領

川崎から優先度の高いタスクを受け取る：
- バグ修正
- 機能追加
- コンテンツ更新
- 等

---

## チェックリスト（コピーして使ってください）

```
=== Day 1 ===
[ ] GitHub招待を承認
[ ] Vercel招待を承認
[ ] Supabase招待を承認
[ ] Cloudflare招待を承認
[ ] Anthropic APIキーを受領
[ ] リポジトリをクローン
[ ] localhostでトップページ表示確認
[ ] VS Code でリポジトリを開く
[ ] README.md を読了
[ ] HANDOFF.md を読了
[ ] CREDENTIALS.md を読了
[ ] BRAND.md を読了

=== Day 2 ===
[ ] GitHub の状態確認
[ ] Vercel Deployments確認
[ ] Supabase 各画面確認
[ ] Cloudflare Worker 確認
[ ] Anthropic Console確認
[ ] テストPR作成 → マージ → 自動デプロイ確認
[ ] テスト変更を元に戻し
[ ] テストデータでマッチング作成・削除
[ ] 管理画面で各機能を試す

=== Day 3〜 ===
[ ] 川崎との同期ミーティング
[ ] 最初のタスクを受領
```

---

## 困ったらすぐ川崎へ

- 招待が届かない
- ログインできない
- ドキュメントの記述が古い／間違ってる
- 何から手をつけていいかわからない

→ 遠慮なく連絡してください。

### 連絡先
- **川崎勇樹**
- メール：kawasaki@facing.co.jp
- Slack：facing株式会社のワークスペース

---

## 関連ドキュメント

- [README.md](README.md) - 全ドキュメント一覧
- [HANDOFF.md](HANDOFF.md) - メイン引き継ぎ資料
- [CREDENTIALS.md](CREDENTIALS.md) - クレデンシャル管理
- [DATABASE.md](DATABASE.md) - DB完全ガイド
- [PAGES.md](PAGES.md) - 各ページ仕様
- [WORKER.md](WORKER.md) - Cloudflare Worker詳細
- [BRAND.md](BRAND.md) - デザインシステム
- [OPERATIONS.md](OPERATIONS.md) - 運用タスク手順
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - トラブル対処

---

最終更新: 2026年4月27日
