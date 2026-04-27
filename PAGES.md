# PAGES 全ページ詳細仕様

> CSLINK の全HTMLページの仕様・データソース・依存関係をまとめたリファレンス。

---

## 共通要素

### 全HTMLが読み込むスクリプト

```html
<!-- フォント -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@400;500;700&family=Space+Grotesk:wght@400;500;700&family=Yuji+Syuku&display=swap" rel="stylesheet">

<!-- Supabase JS（CDN）-->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

<!-- CSLINK 設定・クライアント -->
<script src="js/config.js"></script>
<script src="js/supabase-client.js"></script>
```

> ⚠️ 順序が重要：`@supabase/supabase-js` → `config.js` → `supabase-client.js`

### 共通ナビゲーション

全8ページに以下のナビが入っている（順番統一）：
1. 機能（cslink_features_v5.html）
2. 使い方・事例（cslink_howto_fixed.html）
3. 料金（cslink_pricing.html）
4. CSプロ一覧（cslink_list_v2.html）
5. 企業向け（→ register_client.html or 別ページ）
6. CS人材向け（→ register_pro.html or 別ページ）
7. CS会社を見る（外部リンク or list）
8. 無料で始める（CTA）

ナビ追加・変更時は **8ページ全部** を同時に更新する必要あり。

### 共通フッター
- 会社情報（facing株式会社）
- 利用規約・プライバシーポリシーへのリンク
- copyright

---

## 1. index.html（トップページ）

### URL
`https://cslink.link/`

### 認証
不要

### 主要セクション
1. **ヘッダー**：ロゴ + ナビゲーション
2. **ヒーローエリア**：
   - キャッチコピー「解約が止まる。CSのプロが、今日つながる。」
   - サブコピー「AIが要件を聞いて、最適なCS企業・人材を28秒で提案。」
   - CTA：「CSのプロを無料で探す（企業向け）」「→ CS人材・企業として登録する」
3. **AIマッチングストリーム**：
   - 上部に企業候補（リテンションラボ株式会社等）のアニメーション
4. **AIチャットボット**（右下浮かび上がりUI）：
   - Cloudflare Worker `/chat` を呼ぶ
5. **特徴セクション**：AI分析・24時間以内・0円
6. **6つの特徴**：CS特化／BPO連携／完全無料／法人運営／AI28秒／案件数
7. **CSプロ紹介**：田中美咲（CS顧問）等のサンプル
8. **使い方**：3ステップ
9. **料金**：完全無料 + 成約時10%
10. **CTA**：登録誘導
11. **フッター**

### 使うAPI
- `Cloudflare Worker /chat`：AIチャット応答

### 動的データ
- なし（静的）

### 注意点
- ヒーローの背景画像（女性）はデモ画像なので差し替え推奨
- ロゴは favicon.svg のSVGをインライン展開

---

## 2. cslink_features_v5.html（機能・チャットボット）

### URL
`https://cslink.link/cslink_features_v5.html`

### 認証
不要

### 主要セクション
1. ヘッダー + ナビ
2. ヒーロー：機能ハイライト
3. AIチャットボット説明（マッチングフロー）
4. 6機能の詳細：
   - AIマッチング
   - スクリーニング
   - チャット
   - 通知
   - 分析ダッシュボード
   - セキュリティ
5. 競合比較表
6. CTA
7. フッター

### 使うAPI
- `Cloudflare Worker /chat`（チャットボット）

### 動的データ
- なし

---

## 3. cslink_howto_fixed.html（使い方・事例）

### URL
`https://cslink.link/cslink_howto_fixed.html`

### 認証
不要

### 主要セクション
1. ヘッダー + ナビ
2. 使い方：
   - 企業向け4ステップ
   - CSプロ向け4ステップ
3. 事例ストーリー（テキスト中心）
4. FAQ
5. CTA
6. フッター

### 動的データ
- なし

---

## 4. cslink_pricing.html（料金）

### URL
`https://cslink.link/cslink_pricing.html`

### 認証
不要

### 料金体系
- **企業側**：完全無料
- **CS側**：成約時の手数料 10%

### セクション
1. ヘッダー
2. 料金プラン表
3. 料金に含まれるもの／含まれないもの
4. FAQ
5. CTA
6. フッター

### 注意
料金変更時は **このページ + index.html + cslink_register_client.html** の表記を全部更新。

---

## 5. cslink_list_v2.html（CSプロ一覧）

### URL
`https://cslink.link/cslink_list_v2.html`

### 認証
不要（公開）

### データソース
**Supabase `professionals` テーブル**：
- `status = 'approved'` のレコードのみ表示
- 並び順：`created_at DESC`

### 表示カラム
- name（氏名）
- activity（活動形態）
- specialties（得意領域）
- experience（経験年数）
- rate（料金感）
- url（外部リンク・あれば）

### 使うAPI
```javascript
window.CSLINK.professional.listApproved()
// → SELECT * FROM professionals WHERE status = 'approved'
```

### 動作確認
1. Supabase Table Editor で `professionals.status = 'approved'` のレコードを1件作る
2. このページにアクセス → 該当レコードが表示されればOK

### 注意点
- 検索フィルタは現状クライアント側で簡易フィルタのみ
- 大量データになったら全文検索化（pgvector or PostgREST RPC）

---

## 6. cslink_pro_detail.html（CSプロ詳細）

### URL
`https://cslink.link/cslink_pro_detail.html?id={UUID}`

### 認証
不要（公開）

### データソース
URLパラメータ `id` で `professionals` テーブルから取得：
- `status = 'approved'` のレコードのみ表示

### 表示カラム
- name, activity, specialties, experience, achievement, worktype, starttime, rate, url

### 使うAPI
```javascript
window.CSLINK.professional.getPublic(id)
// → SELECT ... FROM professionals WHERE id = ? AND status = 'approved'
```

### エラー処理
- `id` が無効 / レコードなし / status != approved → 「プロフィールが見つかりません」表示

---

## 7. cslink_register_client.html（企業登録フォーム）

### URL
`https://cslink.link/cslink_register_client.html`

### 認証
不要

### フォーム項目
- 企業名（必須）
- 担当者名
- メール（必須）
- 業種
- 企業規模
- 抱えている課題（テキストエリア）
- 予算
- 開始希望時期
- 連絡方法

### 送信処理
1. クライアントサイドでバリデーション
2. `companies` テーブルに INSERT（status='pending'）
3. 成功 → サンキューページ表示
4. （任意）Cloudflare Worker `/register` に通知転送

### 使うAPI
```javascript
window.CSLINK.company.register(payload)
// → INSERT INTO companies VALUES (...)
```

### RLS
`companies_anon_insert` ポリシーで、未認証ユーザーも INSERT 可能。

---

## 8. cslink_register_pro.html（CSプロ登録フォーム）

### URL
`https://cslink.link/cslink_register_pro.html`

### 認証
不要

### フォーム項目
- 氏名（必須）
- メール（必須）
- 電話番号
- 活動形態（個人／法人）
- 屋号・会社名
- CS経験年数
- 直近の役職
- 経験業界
- 得意なCS領域
- 実績（テキストエリア・必須）
- 自己PR（テキストエリア）
- 希望稼働形態
- 希望報酬
- 稼働開始時期
- 勤務場所
- ポートフォリオURL

### 送信フロー（特殊）
1. フォーム入力 → クライアントサイドでバリデーション
2. **Cloudflare Worker `/screen` に POST**
3. AIスクリーニング判定が返る（score / status / comment / next_steps）
4. 結果を画面に表示
5. **同時に** `professionals` テーブルに INSERT（AI判定結果も含む、status='pending'）
6. 完了

### 使うAPI
```javascript
// 1. AIスクリーニング
const screening = await fetch(WORKER_URL + '/screen', {
  method: 'POST',
  body: JSON.stringify(formData)
});

// 2. Supabase 登録（AI結果含む）
window.CSLINK.professional.register({
  ...formData,
  ai_score: screening.score,
  ai_status: screening.status,
  ai_comment: screening.comment,
  status: 'pending'
});
```

### 重要
登録直後は `status='pending'`。**運営が手動で `approved` に変更するまで一覧には出ない**。

---

## 9. cslink_mypage_client.html（企業マイページ）

### URL
`https://cslink.link/cslink_mypage_client.html`

### 認証
**必須**（マジックリンクログイン）

### ログインフロー
1. メアド入力 → 「ログインリンクを送信」
2. メール内リンクをクリック
3. このページに戻ってきて自動ログイン
4. `companies` テーブルから自社情報をロード
5. 関連する `matchings` をロード
6. メッセージのやり取り可能

### 主要機能
- 自社プロフィール表示／編集
- マッチング履歴一覧
- マッチング詳細：CSプロのプロフィール表示
- メッセージ機能（Realtime）
- マッチングステータス更新（accept / decline）

### 使うAPI
```javascript
window.CSLINK.auth.sendMagicLink(email, '/cslink_mypage_client.html')
window.CSLINK.company.fetchMine()
window.CSLINK.company.linkByEmail()  // 未紐付けレコードを auth_user_id と紐付け
window.CSLINK.matching.listAsCompany(companyId)
window.CSLINK.message.list(matchingId)
window.CSLINK.message.send(matchingId, 'company', content)
window.CSLINK.message.subscribe(matchingId, callback)
window.CSLINK.matching.updateStatus(matchingId, 'accepted')
```

### 注意点
- 登録時のメアド = ログイン時のメアドが一致しないと自分のレコードを認識できない
- 違うメアドでログインしたら、`linkCompanyByEmail()` で email一致のレコードを auto link する仕組み

---

## 10. cslink_mypage_pro.html（CSプロマイページ）

### URL
`https://cslink.link/cslink_mypage_pro.html`

### 認証
**必須**（マジックリンクログイン）

### 主要機能
- 自分のプロフィール表示／編集
- マッチング案件一覧
- マッチング詳細：企業プロフィール表示
- メッセージ機能（Realtime）
- 案件への応答（accept / decline）

### 使うAPI
```javascript
window.CSLINK.auth.sendMagicLink(email, '/cslink_mypage_pro.html')
window.CSLINK.professional.fetchMine()
window.CSLINK.professional.linkByEmail()
window.CSLINK.matching.listAsProfessional(professionalId)
window.CSLINK.message.list / send / subscribe
window.CSLINK.matching.updateStatus(matchingId, 'accepted')
```

---

## 11. cslink_admin.html（運営管理画面）

### URL
`https://cslink.link/cslink_admin.html`

### 認証
**必須**：マジックリンクログイン + `admin_users` テーブル登録

### ログインフロー
1. メアド入力 → 「ログインリンクを送信」
2. メール内リンクをクリック
3. このページに戻ってログイン
4. **isAdmin() チェック**：admin_users に auth_user_id が登録されているか
5. 登録されていれば管理画面表示、未登録なら signOut + エラー

### 主要画面
- **ダッシュボード**：各テーブルの件数概要
- **企業一覧**：companies テーブル全件
- **CSプロ一覧**：professionals テーブル全件（status別フィルタ）
- **マッチング一覧**：matchings + 関連 companies/professionals
- **メッセージ閲覧**：matching_id で絞ったメッセージ一覧

### 主要操作
- CSプロ status 変更（pending → approved / rejected）
- 企業 status 変更
- マッチング作成（company × professional）
- マッチング status 変更
- メッセージ送信（adminとして）

### 使うAPI
```javascript
window.CSLINK.admin.isAdmin()
window.CSLINK.admin.listCompanies()
window.CSLINK.admin.listProfessionals()
window.CSLINK.admin.listMatchings()
window.CSLINK.admin.createMatching(companyId, professionalId, score)
window.CSLINK.admin.updateCompanyStatus(id, 'active')
window.CSLINK.admin.updateProfessionalStatus(id, 'approved')
window.CSLINK.message.list(matchingId)
window.CSLINK.message.send(matchingId, 'admin', content)
```

### 既知の修正履歴
**2026-04-27**: `showLoginOverlay()` 関数で `pwInput` 要素（存在しない）を参照して `TypeError: Cannot set properties of null` でクラッシュしていた問題を修正。

---

## 12. company.html（会社概要）

### URL
`https://cslink.link/company.html`

### 内容
- facing株式会社の正式情報
- 商号・代表・所在地・TEL
- 事業内容
- 労働者派遣事業許可番号
- プライバシーマーク

### 注意
- **資本金・従業員数は記載しない方針**
- CEO表記：「川崎勇樹」で統一

---

## 13. terms.html（利用規約）

### URL
`https://cslink.link/terms.html`

### 内容
- サービスの利用規約
- 利用者の禁止事項
- 免責事項
- 規約変更ルール

### 注意
法的内容なので、**変更時は法務確認**を推奨。

---

## 14. privacy.html（プライバシーポリシー）

### URL
`https://cslink.link/privacy.html`

### 内容
- 個人情報の取扱い
- 利用目的
- 第三者提供
- 開示・訂正・削除請求の方法
- お問い合わせ窓口

### 注意
- プライバシーマーク取得済みなので、**Pマーク基準に準拠**
- 改訂時は Pマーク事務局確認

---

## 15. 404.html

### URL
存在しないページにアクセスされた時に Vercel が返す。

### 内容
- 404エラー表示
- トップページへの戻りリンク

---

## ページ間の遷移マップ

```
[トップ index.html]
  ├─→ [機能 features_v5]
  ├─→ [使い方 howto]
  ├─→ [料金 pricing]
  ├─→ [プロ一覧 list_v2]
  │     └─→ [プロ詳細 pro_detail?id=xxx]
  ├─→ [企業登録 register_client]
  │     └─→ サンキュー → マイページへ誘導
  └─→ [プロ登録 register_pro]
        └─→ AI判定結果 → マイページへ誘導

[企業マイページ mypage_client]  (要ログイン)
  └─→ マッチング詳細 → メッセージ

[プロマイページ mypage_pro]  (要ログイン)
  └─→ 案件詳細 → メッセージ

[管理画面 admin]  (要admin)
  ├─→ 企業一覧
  ├─→ プロ一覧
  ├─→ マッチング一覧
  └─→ メッセージ閲覧
```

---

## 新規ページ追加チェックリスト

新しいHTMLページを追加するときの注意点：

- [ ] ファビコン link tag を入れる
- [ ] フォント（Google Fonts）を読み込む
- [ ] CSLINK の CSS変数（`:root` で定義）を継承
- [ ] @supabase/supabase-js を CDN で読み込む（必要なら）
- [ ] `js/config.js` `js/supabase-client.js` を読み込む（必要なら）
- [ ] OGPメタタグ追加（`og:title`, `og:image`, `og:url`）
- [ ] ナビゲーションを統一（既存8ページと同じ並び）
- [ ] フッターを統一
- [ ] レスポンシブ対応（min-width: 360px〜）
- [ ] sitemap.xml に追加
- [ ] 必要なら robots.txt に追記

---

最終更新: 2026年4月27日
