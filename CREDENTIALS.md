# クレデンシャル一覧

> ⚠️ **重要**: このドキュメントには **実際のキー・パスワードは記載しません**。
> 「何があるか」「どこで取得するか」「どこで使われているか」だけをまとめています。
> 実値は別途、川崎からSlack DM・1Password共有・対面メモなどで安全に共有します。

---

## 1. パブリックなキー（GitHubに含まれてOK）

### Supabase Anon Key
- **場所**: [js/config.js:6](js/config.js)
- **何**: Supabaseの匿名公開キー
- **公開してOK?**: ✅ はい（RLSで権限制限されているため）
- **取得**: Supabase Dashboard → Settings → API → `anon` `public`

### Supabase URL
- **場所**: [js/config.js:5](js/config.js)
- **値**: `https://xatjfhleqgubgrnqzxrs.supabase.co`
- **公開してOK?**: ✅ はい

### Cloudflare Worker URL
- **場所**: [js/config.js:7](js/config.js)
- **値**: `https://cslink-ai-proxy.kawasaki-be9.workers.dev`
- **公開してOK?**: ✅ はい

---

## 2. シークレット（GitHubに絶対入れない）

### Supabase Service Role Key
- **何**: DBへのフルアクセス権限を持つ管理者キー
- **公開**: ❌ 絶対NG
- **使用箇所**: 通常使わない。バックアップツール・Admin APIスクリプト用
- **取得**: Supabase Dashboard → Settings → API → `service_role` → Reveal
- **取得URL**: https://supabase.com/dashboard/project/xatjfhleqgubgrnqzxrs/settings/api
- **漏洩時の対処**: 同画面の「Reset」または「Generate new」で再発行

### Anthropic API Key
- **何**: Claude API用APIキー
- **公開**: ❌ 絶対NG
- **使用箇所**: Cloudflare Worker（`ANTHROPIC_API_KEY` 環境変数）
- **取得**: https://console.anthropic.com → API Keys
- **設定箇所**: Cloudflare Workers → `cslink-ai-proxy` → Settings → Variables → Add Variable (Type: Secret)
- **漏洩時の対処**: Anthropic console で該当キーを Revoke し、新しいキーを発行 → Cloudflare Worker の Secret を更新

### Vercel Personal Access Token（必要時のみ）
- **何**: Vercel CLI / API用
- **使用箇所**: 通常GUI操作で十分なので不要。CIで使う場合のみ
- **取得**: https://vercel.com/account/tokens

### GitHub Personal Access Token（必要時のみ）
- **何**: gh CLI / API用
- **使用箇所**: 通常はSSH/HTTPS認証で十分
- **取得**: https://github.com/settings/tokens

---

## 3. ログイン情報（川崎管理）

### 各サービスのアカウント
すべて **川崎のGoogleアカウント** で作成・SSOログイン：

| サービス | ログインID | 管理者 |
|---|---|---|
| GitHub | kawasaki-facing | 川崎 |
| Vercel | (Googleアカウント連携) | 川崎 |
| Supabase | (Googleアカウント連携) | 川崎 |
| Cloudflare | (川崎メアド) | 川崎 |
| Anthropic | (川崎メアド) | 川崎 |
| ドメイン契約 | （別途管理） | 川崎 |

> 髙橋さんは各サービスから **メンバー招待** を受けて、ご自身のアカウントで参加してください。

### CSLINK 管理画面のログイン
- **URL**: https://cslink.link/cslink_admin.html
- **管理者メアド**: `kawasaki@facing.co.jp`（auth.users id: `15115009-d9c9-4f77-af5f-a372d4696edf`）
- **認証方式**: マジックリンク（メール経由）
- **新しい管理者を追加するSQL**:
```sql
insert into public.admin_users (auth_user_id, email, name)
select id, email, '名前'
  from auth.users
 where email = 'new-admin@example.com'
on conflict do nothing;
```

---

## 4. 環境変数（Cloudflare Worker）

`cslink-ai-proxy` Workerに設定済み：

| 変数名 | 種類 | 必須 | 説明 |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | Secret | ○ | Claude API用 |
| `NOTIFY_WEBHOOK_URL` | Var | × | 任意の通知Webhook（未使用ならOK） |

確認/変更場所：
Cloudflare Dashboard → Workers & Pages → `cslink-ai-proxy` → Settings → Variables

---

## 5. クレデンシャル運用ルール

### やっていいこと
- ✅ ローカルの `.env` ファイル（gitignore済み）に保存して開発に使う
- ✅ 1Password・Bitwarden等のパスワード管理ツールに保存
- ✅ Cloudflare Workers Secrets / Vercel Environment Variables に登録
- ✅ Supabase Vault に保存（DB内秘匿）

### やっちゃダメなこと
- ❌ GitHubリポジトリにコミット
- ❌ Slackパブリックチャンネルに貼り付け
- ❌ メールに平文で送信
- ❌ Markdownドキュメントに記載
- ❌ ブラウザのフロントエンドJSに直接埋め込み（`config.js` のanon keyは例外）

### 漏洩時の即時対応
1. **該当サービスでキーをRevoke / Reset**
2. **使われている箇所（Worker, クライアント等）に新しいキーを反映**
3. **Gitに混入していたらhistoryからも削除**（git filter-repo / BFG Repo Cleaner）
4. **川崎に即連絡**

---

## 6. 引き継ぎ時の鍵共有手順（川崎用メモ）

髙橋さんに渡すもの：

- [ ] GitHub Collaborator招待（リポジトリ単位）
- [ ] Vercel Team / Project Member招待
- [ ] Supabase Organization Member招待
- [ ] Cloudflare Account招待（または専用API token発行）
- [ ] Anthropic API key（Slack DMで送信、使用後はRotate推奨）
- [ ] このCREDENTIALS.mdを共有
- [ ] HANDOFF.md / ONBOARDING.md を読んでもらう

---

最終更新: 2026年4月27日
