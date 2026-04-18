# CSLINK デプロイ手順書（2026/04/18 アップデート）

## このアップデートで完了したこと

### Phase 1: OGP・ファビコン統一
- OGP URLを全ページで `cslink.link` に統一
- OGP画像（`ogp.png`）を新規生成
- ファビコン一式を作成（SVG/PNG/ICO）
- Twitter Card、canonical、theme-color を全ページに追加

### Phase 2: プロ登録フォーム新規作成＋AIスクリーニング
- `cslink_register_pro.html` を CS人材専用フォームにリライト
- Cloudflare Worker に `/screen` エンドポイントを追加（AI評価＋スコアリング）
- プロ登録用のGASスクリプトを新規作成

---

## デプロイ手順

### ステップ1: GitHubへHTMLと画像をアップロード

**アップロードするファイル（合計18ファイル）:**

画像系（新規6ファイル）:
- `ogp.png` ← OGP画像（1200x630）
- `favicon.svg` ← ベクターファビコン
- `favicon.ico` ← レガシーブラウザ用
- `favicon-32.png` ← 32pxファビコン
- `apple-touch-icon.png` ← iOS用180px
- `icon-192.png` / `icon-512.png` ← PWA用（任意）

HTML系（修正11ファイル）:
- `index.html`
- `cslink_features_v5.html`
- `cslink_howto_fixed.html`
- `cslink_list_v2.html`
- `cslink_pricing.html`
- `cslink_pro_detail.html`
- `cslink_register_client.html`
- `cslink_register_pro.html` ← **全面リライト**
- `company.html`
- `privacy.html`
- `terms.html`

**操作:**
1. Downloadsフォルダで、ファイル名の末尾に連番（例: `index_28.html`）が付いていないか確認
   （付いていたら `index.html` に戻す）
2. https://github.com/kawasaki-facing/cslink を開く
3. 「Add file」→「Upload files」をクリック
4. すべてのファイルをドラッグ＆ドロップ
5. 「Commit changes」で確定
6. Vercelが1〜2分で自動デプロイ

### ステップ2: Cloudflare Worker を更新

1. https://dash.cloudflare.com にログイン
2. Workers & Pages → `cslink-ai-proxy` を選択
3. 「Edit code」または右上の「Quick edit」
4. エディタで **Cmd+A**（全選択）→ **Cmd+V** で `worker.js` の内容に置き換え
5. 「Save and Deploy」をクリック

### ステップ3: プロ登録シート用のGASを新規作成

1. 新しいGoogleスプレッドシートを作成（タイトル: `CSLINK プロ登録データ` など）
2. 作成したシートのIDをコピー（URLの `/d/【ここ】/edit` 部分）
3. 拡張機能 → Apps Script
4. `gas_pro_registration.js` の内容を貼り付け
5. 先頭の `SHEET_ID` を実際のIDに置き換え
6. 保存 → デプロイ → 新しいデプロイ
   - 種類: ウェブアプリ
   - 実行ユーザー: 自分
   - アクセス: 全員
7. デプロイ後に表示される **Web App URL** をコピー

### ステップ4: Cloudflare WorkerにGAS URLを環境変数として登録

1. Cloudflare Dashboard → `cslink-ai-proxy` ワーカー
2. Settings → Variables and Secrets
3. 新規変数を追加:
   - Name: `GAS_PRO_URL`
   - Type: Plaintext（Secretではない）
   - Value: ステップ3でコピーしたGAS Web App URL
4. 「Save」で保存

### ステップ5: 動作確認

1. https://cslink.link/ にアクセス
   - ファビコンがタブに表示されるか
2. SNSに https://cslink.link/ を貼ってプレビュー確認
   - Twitter Card Validator: https://cards-dev.twitter.com/validator
   - Facebook Debugger: https://developers.facebook.com/tools/debug/
3. https://cslink.link/cslink_register_pro.html でフォーム動作確認
   - テストデータを入力して送信
   - AI分析画面が表示され、スコア・ステータス・次のステップが出る
   - kawasaki@facing.co.jp に通知メールが届く
   - プロ登録シートに行が追加される

---

## トラブルシューティング

### ファビコンが表示されない
- ブラウザキャッシュをクリア（Cmd+Shift+R / Ctrl+Shift+R）
- favicon.svg, favicon.ico 等のファイル名・配置先パスを確認（ルート直下 `/favicon.svg`）

### OGP画像がSNSで表示されない
- Vercelにデプロイ完了しているか確認（`https://cslink.link/ogp.png` 直アクセスで表示されるか）
- Facebook/Twitterは過去のキャッシュを持っているため、各Validatorで手動でキャッシュ更新

### AIスクリーニングが「面談後に判定」固定になる
- Cloudflare Workerのログ（Logs タブ）でAPIエラーを確認
- `ANTHROPIC_API_KEY` が正しく設定されているか再確認
- AI出力がJSON形式でない可能性 → コード内 `parseAIJson` でパース失敗時にフォールバック動作中

### GASへの保存がされない
- `GAS_PRO_URL` が Cloudflare Worker に設定されているか
- GASのデプロイ設定でアクセス権が「全員」になっているか
- GAS側の実行ログ（実行数タブ）で失敗がないか

---

## 今回の変更による影響範囲

- SEO: canonical追加でURL正規化が効く。sitemap.xml の更新推奨
- SNS: OGP画像が正しく表示されるように
- ブランディング: 全ページでファビコン統一
- UX: CS人材向けの独立した登録動線ができ、プロ登録が可能に
- データ: AIスクリーニング結果（score, status, comment）もシートに自動記録

## 次のステップの候補

- sitemap.xml の生成・配置（SEO改善）
- Google Search Console へのサイト登録
- プロ登録フォームからの問い合わせが来た場合の、facing担当者のオペレーション設計
