# BRAND ブランド・デザインシステム

> CSLINK のビジュアルアイデンティティとデザイン規則。
> 新規ページ作成・既存ページ修正時はこのドキュメントに従ってください。

---

## 目次

1. [ブランド基本情報](#1-ブランド基本情報)
2. [カラーパレット](#2-カラーパレット)
3. [フォント](#3-フォント)
4. [ロゴ](#4-ロゴ)
5. [タイポグラフィ規則](#5-タイポグラフィ規則)
6. [UIコンポーネント](#6-uiコンポーネント)
7. [画像・素材](#7-画像素材)
8. [OGP・SNS](#8-ogpsns)
9. [レスポンシブ規則](#9-レスポンシブ規則)
10. [ボイス・トーン](#10-ボイストーン)

---

## 1. ブランド基本情報

| 項目 | 内容 |
|---|---|
| サービス名 | **CSLINK** |
| 読み | シーエスリンク |
| URL | https://cslink.link |
| 運営 | facing株式会社 |
| タグライン | **解約が止まる。CSのプロが、今日つながる。** |
| キーフレーズ | 「CS特化AIマッチング」「28秒で提案」「完全無料」 |

### サービスの世界観
- **モダン**：技術的・洗練されている
- **信頼**：法人向けで重厚感
- **温かみ**：CSという「人」が中心の事業
- **スピード感**：AIによる即時マッチング

---

## 2. カラーパレット

### CSS 変数定義（index.html `:root` より）

```css
:root {
  /* メインカラー */
  --teal: #06b6d4;          /* アクセント・主色 */
  --teal-deep: #0891b2;     /* 濃いティール */

  /* 背景・主色 */
  --navy: #0f2342;          /* ダークネイビー */
  --navy-mid: #1e3a5f;      /* 中間ネイビー */

  /* テキスト */
  --text: #1a2744;          /* 本文テキスト */
  --muted: #64748b;         /* ミュートテキスト */

  /* 補助色 */
  --bg: #ffffff;            /* 背景 */
  --bg-alt: #f8fafc;        /* 補助背景 */
}
```

### カラーガイド

| 色 | HEX | 使い所 |
|---|---|---|
| ![Teal](https://via.placeholder.com/15/06b6d4/06b6d4) Teal | `#06b6d4` | CTAボタン、リンク、ロゴ、ハイライト |
| ![Teal Deep](https://via.placeholder.com/15/0891b2/0891b2) Teal Deep | `#0891b2` | グラデの濃い側、ホバー |
| ![Navy](https://via.placeholder.com/15/0f2342/0f2342) Navy | `#0f2342` | ヘッダー背景、フッター背景 |
| ![Navy Mid](https://via.placeholder.com/15/1e3a5f/1e3a5f) Navy Mid | `#1e3a5f` | 影、グラデ中間色 |
| ![Text](https://via.placeholder.com/15/1a2744/1a2744) Text | `#1a2744` | 本文テキスト |
| ![Muted](https://via.placeholder.com/15/64748b/64748b) Muted | `#64748b` | サブテキスト、注釈 |

### グラデーションの使い方

```css
/* メインCTAボタン */
background: linear-gradient(135deg, var(--teal), #0891b2);

/* ヒーロー背景 */
background: linear-gradient(180deg, var(--navy), var(--navy-mid));

/* ロゴアイコン */
background: linear-gradient(135deg, #06b6d4, #0891b2);
```

### 使ってはいけない色
- 純黒 `#000000`（→ `--navy` `--text` を使う）
- 純白以外の薄いグレー（→ `--bg-alt` を使う）
- 派手な赤・黄色（エラー表示以外）

### エラー・警告色

| 用途 | HEX | 例 |
|---|---|---|
| エラー（赤） | `#ef4444` | バリデーションエラー、削除確認 |
| 成功（緑） | `#22c55e` | 送信成功、保存完了 |
| 警告（オレンジ） | `#f59e0b` | 注意喚起 |
| 情報（ブルー） | `#3b82f6` | 案内通知 |

---

## 3. フォント

### Google Fonts 読み込み

全HTMLで以下を読み込む（`<head>` 内）：

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@400;500;700&family=Space+Grotesk:wght@400;500;700&family=Yuji+Syuku&display=swap" rel="stylesheet">
```

### フォントファミリー

| フォント | 用途 |
|---|---|
| **Zen Kaku Gothic New** | 日本語ボディ、ナビ、ボタン |
| **Space Grotesk** | 英数字、数字、ロゴ |
| **Yuji Syuku** | 日本語セリフ（ストーリータイトル等、装飾用） |

### CSS body デフォルト

```css
body {
  font-family: 'Zen Kaku Gothic New', 'Hiragino Sans', 'Yu Gothic', sans-serif;
  color: var(--text);
  line-height: 1.7;
  -webkit-font-smoothing: antialiased;
}

/* 数字・英字を選択的にSpace Grotesk化 */
.num, .en {
  font-family: 'Space Grotesk', 'Zen Kaku Gothic New', sans-serif;
}
```

### ウェイト指針

| 要素 | font-weight |
|---|---|
| 通常本文 | 400 |
| やや強調 | 500 |
| 太字・見出し | 700 |
| エクストラボールド | 800 (h1, ヒーロー) |

---

## 4. ロゴ

### ロゴデザイン
- **アイコン**：ティールのグラデーション（`#06b6d4` → `#0891b2`）の角丸正方形
- **アイコン内**：白文字「CS」（Space Grotesk Bold）
- **テキスト**：`CS`（白）+ `LINK`（ティール）

### ファビコン
[favicon.svg](favicon.svg) にSVGとして定義。ブラウザタブに表示される。

```html
<link rel="icon" type="image/svg+xml" href="favicon.svg">
<link rel="icon" type="image/x-icon" href="favicon.ico">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
```

### ロゴサイズの推奨

| 用途 | サイズ |
|---|---|
| ヘッダー（PC） | 高さ 32-40px |
| ヘッダー（モバイル） | 高さ 28-32px |
| OGP画像 | 200×200px 程度 |
| ファビコン | 32×32px / 192×192 / 512×512 |

### ロゴHTML例

```html
<a href="/" class="logo">
  <span class="logo-icon">CS</span>
  <span class="logo-text">
    <span class="cs">CS</span><span class="link">LINK</span>
  </span>
</a>
```

```css
.logo-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, #06b6d4, #0891b2);
  color: #fff;
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700;
  font-size: 14px;
}
.logo-text .cs { color: var(--navy); font-weight: 800; }
.logo-text .link { color: var(--teal); font-weight: 700; }
```

---

## 5. タイポグラフィ規則

### 見出しサイズ（PC基準）

| 要素 | font-size | font-weight |
|---|---|---|
| h1（ページタイトル） | 48-64px | 800 |
| h2（セクションタイトル） | 32-40px | 700 |
| h3（サブタイトル） | 24-28px | 700 |
| h4 | 18-20px | 700 |
| body | 16px | 400 |
| small | 13-14px | 400 |
| caption | 11-12px | 500 |

### モバイル時の縮小率
- h1: 70-80%
- h2: 75-85%
- h3: 80-90%
- body: そのまま 16px

### 行間

```css
h1, h2, h3 { line-height: 1.3; }
body, p { line-height: 1.7; }
small { line-height: 1.6; }
```

### 文字間（letter-spacing）

```css
/* 日本語見出しは少しゆったり */
h1, h2 { letter-spacing: 0.02em; }

/* 英数ロゴ・キャプション類 */
.logo, .caption-en { letter-spacing: 0.05em; }

/* ボタンラベル */
.btn { letter-spacing: 0.03em; }
```

---

## 6. UIコンポーネント

### ボタン

#### プライマリーボタン（CTA）
```css
.btn-primary {
  background: linear-gradient(135deg, var(--teal), #0891b2);
  color: #fff;
  padding: 14px 24px;
  border: none;
  border-radius: 12px;
  font-weight: 700;
  font-size: 15px;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(6,182,212,0.35);
  transition: transform .2s;
}
.btn-primary:hover { transform: translateY(-1px); }
```

#### セカンダリーボタン
```css
.btn-secondary {
  background: transparent;
  color: var(--teal);
  padding: 14px 24px;
  border: 1.5px solid var(--teal);
  border-radius: 12px;
  font-weight: 700;
  font-size: 15px;
  cursor: pointer;
}
```

#### テキストボタン（リンク風）
```css
.btn-text {
  background: none;
  color: var(--teal);
  border: none;
  font-weight: 500;
  cursor: pointer;
}
.btn-text:hover { text-decoration: underline; }
```

### カード

```css
.card {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(15,35,66,0.08);
}

/* ハイライトカード */
.card-highlight {
  background: linear-gradient(135deg, #fff, #f0fdfa);
  border: 1px solid rgba(6,182,212,0.2);
}
```

### 入力フォーム

```css
.input {
  width: 100%;
  padding: 12px 16px;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  font-size: 15px;
  font-family: inherit;
  background: #fff;
  transition: border-color .2s;
}
.input:focus {
  border-color: var(--teal);
  outline: none;
  box-shadow: 0 0 0 3px rgba(6,182,212,0.1);
}
.input.error {
  border-color: #ef4444;
}
```

### バッジ／タグ

```css
.tag {
  display: inline-block;
  padding: 4px 12px;
  background: rgba(6,182,212,0.1);
  color: var(--teal-deep);
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
}

.badge-success { background: rgba(34,197,94,0.15); color: #22c55e; }
.badge-warning { background: rgba(245,158,11,0.15); color: #f59e0b; }
.badge-error { background: rgba(239,68,68,0.15); color: #ef4444; }
```

### モーダル／オーバーレイ

```css
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(15,35,66,0.92);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal {
  background: #fff;
  border-radius: 20px;
  padding: 44px 40px;
  width: min(420px, 92vw);
  box-shadow: 0 20px 60px rgba(6,182,212,0.25), 0 0 0 1px rgba(6,182,212,0.15);
}
```

---

## 7. 画像・素材

### 既存の画像ファイル
| ファイル | 用途 |
|---|---|
| `162.jpg` | （素材） |
| `4typo.jpg` | （素材） |
| `images/` | その他画像アセット |

### 画像追加時の注意
- **形式**: JPG（写真）/ PNG（透過/UI）/ SVG（ロゴ・アイコン）/ WebP（軽量化）
- **サイズ**: 適切に圧縮（TinyPNG等）
- **名前**: `kebab-case.ext`（スネークケース禁止、日本語禁止）
- **保存先**: 用途別に `images/`, `blog/`, `cases/` 等

### 画像最適化チェックリスト
- [ ] 縦横サイズが必要十分か（過大ピクセル数は避ける）
- [ ] 圧縮済みか（容量を確認）
- [ ] alt属性を必ず記載
- [ ] `loading="lazy"` を遅延読み込みに付ける（ファーストビュー以外）

---

## 8. OGP・SNS

### OGP メタタグ（全HTMLに記載）

```html
<meta property="og:title" content="CSLINK | CS特化AIマッチング">
<meta property="og:description" content="解約が止まる。CSのプロが、今日つながる。AIが要件を聞いて、最適なCS企業・人材を28秒で提案。">
<meta property="og:image" content="https://cslink.link/ogp.png">
<meta property="og:url" content="https://cslink.link/">
<meta property="og:type" content="website">
<meta property="og:site_name" content="CSLINK">
<meta property="og:locale" content="ja_JP">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="CSLINK | CS特化AIマッチング">
<meta name="twitter:description" content="解約が止まる。CSのプロが、今日つながる。">
<meta name="twitter:image" content="https://cslink.link/ogp.png">
```

### OGP 画像
- ファイル：[ogp.png](ogp.png) / [ogp.svg](ogp.svg)
- サイズ：1200×630px（推奨）
- 内容：ロゴ + タグライン

### ページ別OGPカスタマイズ
今後の改善候補：各ページで `og:title` `og:description` `og:image` を個別に設定。

```html
<!-- 例：cslink_pricing.html -->
<meta property="og:title" content="料金プラン | CSLINK">
<meta property="og:description" content="CSLINKは企業側完全無料。成約時のみ手数料10%。">
```

---

## 9. レスポンシブ規則

### ブレークポイント

```css
/* モバイル（〜640px）：デフォルト */
/* Tablet 以上 */
@media (min-width: 641px) { ... }
/* Desktop */
@media (min-width: 1024px) { ... }
/* Large Desktop */
@media (min-width: 1280px) { ... }
```

### デザイン原則
- **Mobile First**：CSSはモバイル基準で書き、`@media min-width` で広げる
- **最小幅 360px** をサポート（iPhone SE 等）
- **タップターゲット 44×44px 以上**
- **横スクロール禁止**：`overflow-x: hidden` で防御

### コンテナ

```css
.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

@media (min-width: 1024px) {
  .container { padding: 0 40px; }
}
```

---

## 10. ボイス・トーン

### 文章トーン

#### 一人称
- **私たち**（運営として）
- 「CSLINKは...」「弊社は...」

#### 二人称
- **あなた**（フォーマル過ぎず親しみやすく）
- 「あなたのCS課題に...」

### 文章スタイル

#### ✅ 推奨
- 短く明確に：「解約を止める。CSのプロを今すぐ。」
- 具体的な数字：「28秒で提案」「10%手数料」「完全無料」
- アクション動詞：「探す」「つながる」「成果を出す」
- 親しみやすい敬語：「ご相談ください」「いかがでしょうか」

#### ❌ 避ける
- 専門用語の連発
- 抽象的すぎる表現：「最適化」「ソリューション」を多用
- 過度な敬語：「させていただきます」の連発
- マーケ的すぎる煽り：「今すぐ！」「絶対に！」

### AIチャットボットの口調

[worker.js のシステムプロンプトより](worker.js)：
- 親しみやすく丁寧な日本語
- 1回の返答は120字以内
- 課題ヒアリング優先
- マークダウン記法は使わない（プレーンテキストのみ）
- 箇条書きは「・」（全角中黒）

### エラーメッセージのトーン

#### ❌ 機械的
> エラーが発生しました。再試行してください。

#### ✅ 親しみやすく
> すみません、少し混み合っています。もう一度お試しください。

#### ✅ 具体的に
> メールアドレスの形式が正しくありません。`@` が含まれているかご確認ください。

---

## 11. アニメーション

### トランジション基本
```css
/* 速度：0.2-0.3秒が基本 */
transition: all .25s ease;

/* easing */
ease         → 自然な加減速（デフォルト）
ease-in-out  → 強調用
cubic-bezier(0.16, 1, 0.3, 1) → ふわっと収束（CTA等で使用）
```

### よく使うアニメーション

```css
/* フェードイン */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fadeIn { animation: fadeIn .4s ease forwards; }

/* シェイク（エラー強調） */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-8px); }
  75% { transform: translateX(8px); }
}
.animate-shake { animation: shake .4s; }

/* カードイン（モーダル登場） */
@keyframes cardIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
```

### 過剰なアニメーションは避ける
- ヒーローエリアのみ控えめに
- スクロール連動アニメは慎重に（パフォーマンス影響）
- `prefers-reduced-motion` を尊重：

```css
@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}
```

---

## 12. アクセシビリティ

### 最低限守るべきこと
- [ ] 全画像に `alt` 属性
- [ ] フォーム要素に `<label>` を関連付け
- [ ] ボタンは `<button>` タグ（`<div onclick>` は禁止）
- [ ] リンクは `<a>` タグ
- [ ] 色だけで情報を伝えない（アイコン+テキスト併用）
- [ ] キーボードで全操作可能（Tabキーでフォーカス移動）
- [ ] フォーカスリングを消さない

### コントラスト比
- 通常テキスト：4.5:1 以上
- 大文字（18px+）：3:1 以上
- ナビなど補助：3:1 以上

ティール `#06b6d4` を白背景に置くとコントラスト比 3.0 程度。
ボタンのテキスト等、太字・大きめなら可。本文には使わない。

---

最終更新: 2026年4月27日
