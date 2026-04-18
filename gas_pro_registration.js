/**
 * CSLINK プロ登録シート用 Google Apps Script
 *
 * 【セットアップ手順】
 * 1. プロ登録用のGoogleスプレッドシートを開く
 * 2. 拡張機能 → Apps Script
 * 3. このコード全文を貼り付け
 * 4. 上部の SHEET_ID を実際のスプレッドシートIDに書き換え
 *    （URL の https://docs.google.com/spreadsheets/d/【ここ】/edit の部分）
 * 5. 上部の NOTIFY_EMAIL を確認（デフォルト: kawasaki@facing.co.jp）
 * 6. デプロイ → 新しいデプロイ → 種類: ウェブアプリ
 *    - 実行ユーザー: 自分
 *    - アクセスできるユーザー: 全員
 * 7. デプロイされたURLを Cloudflare Worker の GAS_PRO_URL 環境変数に設定
 */

// ==================== 設定 ====================
const SHEET_ID = 'ここにプロ登録シートのIDを貼り付け';
const SHEET_NAME = 'プロ登録'; // タブ名
const NOTIFY_EMAIL = 'kawasaki@facing.co.jp';
// ===============================================

// ヘッダー行（初回実行時に自動作成）
const HEADERS = [
  '登録日時', 'ステータス(AI)', 'スコア(AI)', 'AIコメント',
  '姓', '名', 'メール', '電話番号',
  '活動形態', '屋号・会社名',
  'CS経験年数', '役職',
  '経験業界', '得意CS領域',
  '実績', '自己PR',
  '希望稼働形態', '希望報酬', '時給単価',
  '稼働開始時期', '勤務場所',
  'ポートフォリオ', '備考',
  '送信元'
];

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const row = buildRow(data);
    writeToSheet(row);
    notifyByEmail(data);
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    console.error(err);
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function buildRow(d) {
  return [
    d.submitted_at || new Date().toLocaleString('ja-JP'),
    d.ai_status || '',
    d.ai_score || '',
    d.ai_comment || '',
    d.last_name || '',
    d.first_name || '',
    d.email || '',
    d.tel || '',
    d.affiliation || '',
    d.company_name || '',
    d.experience || '',
    d.role || '',
    d.industries || '',
    d.specialties || '',
    d.achievement || '',
    d.pr || '',
    d.worktypes || '',
    d.rate || '',
    d.hourly || '',
    d.availability || '',
    d.location || '',
    d.portfolio || '',
    d.memo || '',
    d.source || 'CSLINKプロ登録フォーム'
  ];
}

function writeToSheet(row) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  // 初回実行時：ヘッダー行を作成
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#f0f7fa');
  }
  sheet.appendRow(row);
}

function notifyByEmail(d) {
  const subject = `【CSLINK】プロ登録: ${d.name || '匿名'} / AI判定: ${d.ai_status || 'N/A'}(${d.ai_score || '-'})`;
  const body = [
    '新しいCS人材登録がありました。',
    '',
    `■ AI判定: ${d.ai_status || 'N/A'} / スコア: ${d.ai_score || '-'}`,
    `■ AIコメント: ${d.ai_comment || ''}`,
    '',
    '────────────────',
    `氏名: ${d.name || ''}`,
    `メール: ${d.email || ''}`,
    `電話: ${d.tel || ''}`,
    `活動形態: ${d.affiliation || ''}`,
    `屋号: ${d.company_name || ''}`,
    '',
    `CS経験: ${d.experience || ''} / ${d.role || ''}`,
    `業界: ${d.industries || ''}`,
    `得意領域: ${d.specialties || ''}`,
    '',
    `■ 実績:`,
    d.achievement || '',
    '',
    `■ 自己PR:`,
    d.pr || '',
    '',
    `■ 稼働条件:`,
    `形態: ${d.worktypes || ''}`,
    `報酬: ${d.rate || ''} ${d.hourly ? '/ ' + d.hourly : ''}`,
    `開始: ${d.availability || ''}`,
    `勤務地: ${d.location || ''}`,
    '',
    `ポートフォリオ: ${d.portfolio || ''}`,
    `備考: ${d.memo || ''}`,
    '',
    '────────────────',
    `登録日時: ${d.submitted_at || ''}`,
    `送信元: ${d.source || ''}`,
  ].join('\n');
  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    subject: subject,
    body: body
  });
}

// デバッグ用：Apps Scriptエディタで直接実行できるテスト関数
function testDoPost() {
  const testData = {
    submitted_at: new Date().toLocaleString('ja-JP'),
    last_name: 'テスト',
    first_name: '太郎',
    name: 'テスト 太郎',
    email: 'test@example.com',
    tel: '090-0000-0000',
    affiliation: 'フリーランス・個人事業主',
    company_name: '',
    experience: '5〜10年',
    role: 'CSマネージャー',
    industries: 'SaaS、Eコマース',
    specialties: '解約率改善、オンボーディング設計',
    achievement: 'SaaS企業で月次解約率を3.2%から1.1%に改善した実績があります。',
    pr: 'BtoB SaaSのCSが得意です。エンタープライズ向けの戦略設計に強みがあります。',
    worktypes: '週3〜4',
    rate: '50〜80万円/月',
    hourly: '',
    availability: '1ヶ月以内',
    location: 'フルリモート',
    portfolio: '',
    memo: '',
    ai_status: 'pass',
    ai_score: 82,
    ai_comment: 'CSの専門性が高く、実績にも数値がある。マッチ案件提案に進みます。',
    source: 'CSLINKプロ登録フォーム（テスト）'
  };
  writeToSheet(buildRow(testData));
  notifyByEmail(testData);
  console.log('テスト完了');
}
