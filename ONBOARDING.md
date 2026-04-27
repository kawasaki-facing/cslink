# 髙橋さん オンボーディング手順

> 引き継ぎ初日にやることを時系列で並べました。
> 上から順番にやっていけばCSLINKの開発環境が整います。
> 所要時間：合計1〜2時間程度

---

## Day 1: アクセス権の取得（30分）

### Step 1. 川崎から招待メールを受け取る
以下のサービスから招待が届きます：
- [ ] **GitHub** (kawasaki-facing/cslink リポジトリ)
- [ ] **Vercel** (cslinkプロジェクト)
- [ ] **Supabase** (CS LINKプロジェクト)
- [ ] **Cloudflare** (アカウント or API token)

### Step 2. 各サービスで招待を承認
- GitHub: 招待メールの「View invitation」をクリック → Accept
- Vercel: 同様に Accept
- Supabase: 同様に Accept
- Cloudflare: アクセス情報の通り

### Step 3. 川崎から別途送られるクレデンシャルを受け取る
- [ ] Anthropic API key（worker.jsで使用）
- [ ] Supabase service_role key（必要時のみ。通常は触らない）
- [ ] その他必要なパスワード類

> 💡 **APIキーは絶対にGitHubにcommitしないでください。** 全て環境変数 / Cloudflareシークレット経由で管理。

---

## Day 1: ローカル環境構築（30分）

### Step 4. リポジトリをクローン
```bash
cd ~/Documents  # 任意の場所
git clone https://github.com/kawasaki-facing/cslink.git
cd cslink
```

### Step 5. Gitの設定確認
```bash
git config user.name "髙橋XX"
git config user.email "your-email@example.com"
```

### Step 6. ローカルでサイトを開いて確認
```bash
# Pythonがあれば
python3 -m http.server 5500

# ブラウザで以下を開く
# http://localhost:5500
```

トップページが表示されればOK。

> 💡 ログイン機能（マイページ・管理画面）はlocalhostだとSupabase設定が無い限り動かないので、ローカルでは公開ページの確認のみ。

---

## Day 1: ドキュメントを読む（30分）

### Step 7. 必読ドキュメント
順番に読んでください：

1. **[HANDOFF.md](HANDOFF.md)** ← 全体像を把握
2. **[DEPLOY_README.md](DEPLOY_README.md)** ← セットアップの背景
3. **[migrations/001_schema.sql](migrations/001_schema.sql)** ← DBスキーマ
4. **[js/config.js](js/config.js)** ← 環境設定
5. **[js/supabase-client.js](js/supabase-client.js)** ← API共通ラッパー（重要）

---

## Day 2: 各サービスの管理画面を見る（1時間）

### Step 8. GitHub
- リポジトリのコミット履歴をざっと見る
- Issues・Pull Requests があれば確認
- ブランチ一覧確認（基本は `main` のみ）

### Step 9. Vercel
- Deployments 一覧を見る（直近のビルドが成功しているか）
- Domain設定確認（`cslink.link` がproductionに紐づいているか）
- 環境変数の有無を確認（基本は無し、`js/config.js` で完結）

### Step 10. Supabase
- **Authentication → Users** で登録ユーザー一覧を見る
- **Table Editor** で各テーブルを開いて中身を確認
- **SQL Editor** で簡単なSELECTを試す

```sql
-- 試しに実行してみる
select count(*) from companies;
select count(*) from professionals;
select count(*) from admin_users;
```

- **Auth → URL Configuration** で Site URL / Redirect URLs 確認
- **Logs** でエラーが発生してないか確認

### Step 11. Cloudflare Workers
- `cslink-ai-proxy` Workerのログを確認
- Settings → Variables で `ANTHROPIC_API_KEY` が設定されているか確認（値は見えない、設定済みかどうかだけ）

---

## Day 2: 試しに小さい変更をしてみる（30分）

### Step 12. テスト変更
試しに小さな修正をしてみて、デプロイフローを体験：

例：トップページのフッターに「Last updated: 2026/04/27」を追加してみる

```bash
# 1. ブランチを切る
git checkout -b test/footer-update

# 2. index.html のフッター付近を編集
# 3. 動作確認（ローカル）
python3 -m http.server 5500

# 4. コミット & push
git add index.html
git commit -m "test: フッター更新日表示"
git push origin test/footer-update

# 5. GitHub上でPR作成 → mainにマージ
# 6. Vercelで自動デプロイ確認
# 7. https://cslink.link で反映確認
```

### Step 13. テスト変更を戻す
確認できたら同じフローで元に戻す（または「Revert」ボタンで戻す）。

---

## Day 3〜: 引き継ぎ完了

### Step 14. 川崎との同期ミーティング
- ローカル環境構築できたか
- 各サービスにアクセスできるか
- ドキュメントで不明な点はないか
- 今後のタスク優先順位

---

## チェックリスト（コピーして使ってください）

```
[ ] GitHub招待承認済み
[ ] Vercel招待承認済み
[ ] Supabase招待承認済み
[ ] Cloudflareアクセス取得
[ ] Anthropic APIキー受領
[ ] ローカルクローン完了
[ ] localhostでトップページ表示できた
[ ] HANDOFF.md読了
[ ] DEPLOY_README.md読了
[ ] Supabase管理画面でテーブル確認
[ ] Vercel Deployments確認
[ ] Cloudflare Worker確認
[ ] テストPR作成・マージ・デプロイ確認
[ ] 川崎との同期ミーティング完了
```

---

## 困ったらすぐ川崎へ

- 招待が届かない
- ログインできない
- ドキュメントの記述が古い
- 何から手をつけていいかわからない

→ 遠慮なく連絡してください。
