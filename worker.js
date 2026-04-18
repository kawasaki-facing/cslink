/**
 * CSLINK AI Proxy Worker
 * エンドポイント:
 *   POST /chat     - チャットボット（Anthropic APIプロキシ）
 *   POST /register - 企業登録フォーム（GAS経由でシート保存）
 *   POST /screen   - プロ登録＋AIスクリーニング（NEW）
 *
 * 必須の環境変数（Cloudflare Workers Secrets / Vars）:
 *   ANTHROPIC_API_KEY  (Secret) - Anthropic APIキー
 *   GAS_URL            (Var)    - 企業登録用GAS Web Apps URL（既存）
 *   GAS_PRO_URL        (Var)    - プロ登録用GAS Web Apps URL（NEW・任意）
 *                                  未設定時は GAS_URL にフォールバック
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  ...CORS_HEADERS,
};

export default {
  async fetch(request, env, ctx) {
    // Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (path === '/chat' && request.method === 'POST') {
        return await handleChat(request, env);
      }
      if (path === '/register' && request.method === 'POST') {
        return await handleRegister(request, env, ctx);
      }
      if (path === '/screen' && request.method === 'POST') {
        return await handleScreen(request, env, ctx);
      }
      return new Response(
        JSON.stringify({ ok: true, service: 'CSLINK AI Proxy', endpoints: ['/chat', '/register', '/screen'] }),
        { headers: JSON_HEADERS }
      );
    } catch (err) {
      console.error('Worker error:', err);
      return new Response(
        JSON.stringify({ error: 'Internal error', detail: String(err) }),
        { status: 500, headers: JSON_HEADERS }
      );
    }
  },
};

/* =========================================================================
 * /chat ― チャットボット（既存機能・Anthropic APIプロキシ）
 * ========================================================================= */
async function handleChat(request, env) {
  const body = await request.json();
  const messages = body.messages || [];
  const system = body.system || '';

  const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system,
      messages,
    }),
  });

  const data = await anthropicRes.json();
  let reply = '';
  if (data.content && Array.isArray(data.content)) {
    reply = data.content
      .filter((c) => c.type === 'text')
      .map((c) => c.text)
      .join('\n')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/^#+\s+/gm, '')
      .replace(/^[-*]\s+/gm, '・');
  }

  return new Response(
    JSON.stringify({ reply, raw: data }),
    { headers: JSON_HEADERS }
  );
}

/* =========================================================================
 * /register ― 企業登録フォーム（既存機能・GASへ転送）
 * ========================================================================= */
async function handleRegister(request, env, ctx) {
  const data = await request.json();

  // 非同期でGASに書き込み（応答を待たない）
  ctx.waitUntil(sendToGAS(env.GAS_URL, data));

  return new Response(
    JSON.stringify({ ok: true, message: '登録を受け付けました' }),
    { headers: JSON_HEADERS }
  );
}

/* =========================================================================
 * /screen ― プロ登録＋AIスクリーニング（NEW）
 * ========================================================================= */
async function handleScreen(request, env, ctx) {
  const data = await request.json();

  // 必須項目チェック
  if (!data.name || !data.email) {
    return new Response(
      JSON.stringify({ error: 'name と email は必須です' }),
      { status: 400, headers: JSON_HEADERS }
    );
  }

  // AIスクリーニング実行
  const screening = await runAIScreening(data, env);

  // GASにデータ保存（AI結果も含める・非同期）
  const saveData = {
    ...data,
    ai_score: screening.score,
    ai_status: screening.status,
    ai_comment: screening.comment,
  };
  const gasUrl = env.GAS_PRO_URL || env.GAS_URL;
  ctx.waitUntil(sendToGAS(gasUrl, saveData));

  // フロントに結果を返却
  return new Response(JSON.stringify(screening), { headers: JSON_HEADERS });
}

/* =========================================================================
 * AIスクリーニングの中核ロジック
 * ========================================================================= */
async function runAIScreening(data, env) {
  // AIへの入力を整形
  const profileText = buildProfileText(data);

  const systemPrompt = `あなたはCSLINK（カスタマーサクセス特化AIマッチングプラットフォーム）のAIスクリーニング担当です。
CS（カスタマーサクセス）人材が登録してきたプロフィールを評価し、企業案件へのマッチング可能性を判定します。

【判定基準】
1. CS経験の具体性（年数・役割・業界）
2. 実績の具体性（数値・因果関係が明確か）
3. 自己PRの専門性・説得力
4. 稼働条件と業界需要のマッチ度
5. プロフィール全体の信頼感

【出力】
必ず以下のJSON形式のみで返答してください。前置きや説明は一切不要です。マークダウンのコードブロックも不要です。
{
  "score": 数値(0-100, CSLINKの平均登録者の相対位置),
  "status": "pass" | "review" | "hold",
  "comment": "判定理由を親しみやすい日本語で2〜3文（本人宛メッセージ）",
  "next_steps": ["次のアクション1", "次のアクション2", "次のアクション3"]
}

【statusの判断ルール】
- pass(80点以上): CS経験5年以上 かつ 実績に数値がある かつ 自己PRが具体的
- review(50-79): 一般的なCS経験あり、追加面談で詳細確認したい
- hold(50未満): 実績が抽象的すぎる、経験が浅い、自己PRが不十分

【next_stepsの例】
- pass: ["24時間以内にマッチする案件の具体的な提案をメール送付","初回面談（30分・オンライン）のスケジュール調整","早ければ1週間以内に案件参画開始"]
- review: ["facing担当者より24時間以内にメールでご連絡","初回カジュアル面談（30分・オンライン）で詳細を伺います","面談後にマッチする案件をご紹介"]
- hold: ["プロフィールの追加情報記入をお願いするメールを送付","実績の具体的な数値・背景の追加記載","追加情報を元に再度スクリーニング"]`;

  const userPrompt = `以下のCS人材のプロフィールを評価してください。

${profileText}`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    const result = await res.json();
    let raw = '';
    if (result.content && Array.isArray(result.content)) {
      raw = result.content
        .filter((c) => c.type === 'text')
        .map((c) => c.text)
        .join('');
    }

    // AI出力をJSONパース（マークダウンコードブロック等も吸収）
    const parsed = parseAIJson(raw);
    if (parsed && typeof parsed.score === 'number' && parsed.status && parsed.comment) {
      return {
        score: Math.max(0, Math.min(100, Math.round(parsed.score))),
        status: parsed.status,
        comment: String(parsed.comment),
        next_steps: Array.isArray(parsed.next_steps) ? parsed.next_steps.slice(0, 5) : [],
      };
    }

    // パース失敗時はフォールバック
    return fallbackScreening(data);
  } catch (err) {
    console.error('AI screening error:', err);
    return fallbackScreening(data);
  }
}

/* プロフィール文字列の整形 */
function buildProfileText(data) {
  return [
    `【氏名】${data.name || '不明'}`,
    `【活動形態】${data.affiliation || '未設定'}`,
    data.company_name ? `【屋号・会社名】${data.company_name}` : null,
    `【CS経験年数】${data.experience || '未設定'}`,
    `【直近の役職】${data.role || '未設定'}`,
    `【経験業界】${data.industries || '未設定'}`,
    `【得意なCS領域】${data.specialties || '未設定'}`,
    `【実績】\n${data.achievement || '未記入'}`,
    `【自己PR】\n${data.pr || '未記入'}`,
    `【希望稼働形態】${data.worktypes || '未設定'}`,
    `【希望報酬】${data.rate || '未設定'}${data.hourly ? ` / 時給: ${data.hourly}` : ''}`,
    `【稼働開始時期】${data.availability || '未設定'}`,
    `【勤務場所】${data.location || '未設定'}`,
    data.portfolio ? `【ポートフォリオ】${data.portfolio}` : null,
    data.memo ? `【補足】${data.memo}` : null,
  ].filter(Boolean).join('\n');
}

/* AI出力からJSONを抽出 */
function parseAIJson(text) {
  if (!text) return null;
  // コードブロックを除去
  let cleaned = text.replace(/```(?:json)?\s*/g, '').replace(/```\s*$/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // 最初の { から最後の } までを抽出する試み
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
      } catch (e2) {
        return null;
      }
    }
    return null;
  }
}

/* AI呼び出し失敗時のフォールバック（簡易ルールベース評価） */
function fallbackScreening(data) {
  let score = 50;
  // 経験年数加点
  const exp = data.experience || '';
  if (exp.includes('10年')) score += 20;
  else if (exp.includes('5〜10')) score += 15;
  else if (exp.includes('3〜5')) score += 8;
  else if (exp.includes('1〜3')) score += 3;
  // 役職加点
  const role = data.role || '';
  if (role.includes('VP') || role.includes('部長')) score += 10;
  else if (role.includes('マネージャー')) score += 6;
  else if (role.includes('リーダー')) score += 3;
  // 実績・PR文字数加点
  const ach = (data.achievement || '').length;
  const pr = (data.pr || '').length;
  if (ach >= 200) score += 8;
  else if (ach >= 100) score += 4;
  if (pr >= 300) score += 8;
  else if (pr >= 150) score += 4;
  // 業界・領域の幅
  const ind = (data.industries || '').split('、').filter(Boolean).length;
  const spec = (data.specialties || '').split('、').filter(Boolean).length;
  if (ind >= 3) score += 3;
  if (spec >= 3) score += 3;

  score = Math.max(30, Math.min(95, score));
  let status, comment, next_steps;
  if (score >= 80) {
    status = 'pass';
    comment = 'CS経験が豊富で、実績にも具体性があります。マッチする案件の提案に進みましょう。';
    next_steps = [
      '24時間以内にマッチする案件をメール送付',
      '初回面談（30分・オンライン）のスケジュール調整',
      '早ければ1週間以内に案件参画開始'
    ];
  } else if (score >= 55) {
    status = 'review';
    comment = 'ご登録ありがとうございます。経験と希望条件を踏まえ、面談でより詳しくお話をお聞かせください。';
    next_steps = [
      'facing担当者より24時間以内にメールでご連絡',
      '初回カジュアル面談（30分・オンライン）',
      '面談後にマッチする案件をご紹介'
    ];
  } else {
    status = 'hold';
    comment = 'ご登録ありがとうございます。実績や自己PRの補足情報をいただけると、より良いマッチングが可能になります。';
    next_steps = [
      '追加情報（実績の数値・背景など）の記入をお願いするメールを送付',
      '追加情報を元に再度スクリーニング',
      '面談の必要性を判断してご連絡'
    ];
  }
  return { score, status, comment, next_steps };
}

/* =========================================================================
 * GAS（Google Apps Script）への書き込み
 * - GASはPOSTリクエストをリダイレクトするため redirect: 'follow'
 * - Content-Typeは 'text/plain' にしないとGASが弾く
 * ========================================================================= */
async function sendToGAS(gasUrl, data) {
  if (!gasUrl) {
    console.warn('GAS URL not configured, skipping save');
    return;
  }
  try {
    const res = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(data),
      redirect: 'follow',
    });
    if (!res.ok) {
      console.error('GAS returned non-OK:', res.status, await res.text());
    }
  } catch (err) {
    console.error('GAS fetch error:', err);
  }
}
