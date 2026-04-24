// CSLINK Supabase 共通ラッパー
// 必要前提: @supabase/supabase-js@2 が CDN 経由で先に読み込まれていること
// 必要前提: js/config.js が先に読み込まれていること
(function(){
  if (!window.supabase || !window.supabase.createClient) {
    console.error('[CSLINK] @supabase/supabase-js が未ロードです');
    return;
  }
  var cfg = window.CSLINK_CONFIG;
  if (!cfg || !cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY) {
    console.error('[CSLINK] CSLINK_CONFIG 未設定');
    return;
  }

  var client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'cslink-auth'
    }
  });

  // ---------- Auth ----------
  async function sendMagicLink(email, redirectPath) {
    var emailTrim = String(email || '').trim();
    if (!emailTrim) throw new Error('メールアドレスを入力してください');
    var origin = (typeof window !== 'undefined' && window.location) ? window.location.origin : cfg.SITE_ORIGIN;
    var redirectTo = origin + (redirectPath || window.location.pathname);
    var res = await client.auth.signInWithOtp({
      email: emailTrim,
      options: { emailRedirectTo: redirectTo, shouldCreateUser: true }
    });
    if (res.error) throw res.error;
    return res;
  }

  async function getSession() {
    var res = await client.auth.getSession();
    return res.data && res.data.session ? res.data.session : null;
  }

  async function getUser() {
    var s = await getSession();
    return s ? s.user : null;
  }

  async function signOut() {
    await client.auth.signOut();
  }

  function onAuthChange(cb) {
    return client.auth.onAuthStateChange(function(event, session){ cb(event, session); });
  }

  // ---------- Company (自社プロフィール) ----------
  async function fetchMyCompany() {
    var user = await getUser();
    if (!user) return null;
    var r = await client.from('companies').select('*').eq('auth_user_id', user.id).maybeSingle();
    if (r.error && r.error.code !== 'PGRST116') throw r.error;
    return r.data;
  }

  async function linkCompanyByEmail() {
    // 未紐付けの企業レコードがあれば現在ログインユーザーに紐付ける
    var user = await getUser();
    if (!user || !user.email) return null;
    var existing = await client.from('companies').select('id,auth_user_id').eq('email', user.email).maybeSingle();
    if (existing.data && !existing.data.auth_user_id) {
      var upd = await client.from('companies').update({ auth_user_id: user.id }).eq('id', existing.data.id).select().single();
      if (upd.error) throw upd.error;
      return upd.data;
    }
    return existing.data;
  }

  // ---------- Professional (自分のプロフィール) ----------
  async function fetchMyProfessional() {
    var user = await getUser();
    if (!user) return null;
    var r = await client.from('professionals').select('*').eq('auth_user_id', user.id).maybeSingle();
    if (r.error && r.error.code !== 'PGRST116') throw r.error;
    return r.data;
  }

  async function linkProfessionalByEmail() {
    var user = await getUser();
    if (!user || !user.email) return null;
    var existing = await client.from('professionals').select('id,auth_user_id').eq('email', user.email).maybeSingle();
    if (existing.data && !existing.data.auth_user_id) {
      var upd = await client.from('professionals').update({ auth_user_id: user.id }).eq('id', existing.data.id).select().single();
      if (upd.error) throw upd.error;
      return upd.data;
    }
    return existing.data;
  }

  // ---------- Public (匿名でも読める) ----------
  async function listApprovedProfessionals(opts) {
    opts = opts || {};
    var q = client.from('professionals')
      .select('id,name,activity,specialties,experience,worktype,starttime,rate,url,created_at')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });
    if (opts.limit) q = q.limit(opts.limit);
    var r = await q;
    if (r.error) throw r.error;
    return r.data || [];
  }

  async function getProfessionalPublic(id) {
    var r = await client.from('professionals')
      .select('id,name,activity,specialties,experience,achievement,worktype,starttime,rate,url,created_at,status')
      .eq('id', id)
      .eq('status', 'approved')
      .maybeSingle();
    if (r.error && r.error.code !== 'PGRST116') throw r.error;
    return r.data;
  }

  // ---------- Matchings ----------
  async function listMyMatchingsAsCompany(companyId) {
    if (!companyId) return [];
    var r = await client.from('matchings')
      .select('id,company_id,professional_id,status,match_score,created_at,updated_at,professionals(id,name,activity,specialties,experience,rate)')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
    if (r.error) throw r.error;
    return r.data || [];
  }

  async function listMyMatchingsAsProfessional(professionalId) {
    if (!professionalId) return [];
    var r = await client.from('matchings')
      .select('id,company_id,professional_id,status,match_score,created_at,updated_at,companies(id,name,industry,size,challenges,budget)')
      .eq('professional_id', professionalId)
      .order('created_at', { ascending: false });
    if (r.error) throw r.error;
    return r.data || [];
  }

  async function updateMatchingStatus(matchingId, status) {
    var allowed = ['proposed','accepted','declined','contracted','closed'];
    if (allowed.indexOf(status) < 0) throw new Error('invalid status');
    var r = await client.from('matchings').update({ status: status }).eq('id', matchingId).select().single();
    if (r.error) throw r.error;
    return r.data;
  }

  // ---------- Messages ----------
  async function listMessages(matchingId) {
    var r = await client.from('messages')
      .select('*')
      .eq('matching_id', matchingId)
      .order('created_at', { ascending: true });
    if (r.error) throw r.error;
    return r.data || [];
  }

  async function sendMessage(matchingId, senderType, content) {
    var user = await getUser();
    var payload = {
      matching_id: matchingId,
      sender_type: senderType,
      sender_id: user ? user.id : null,
      content: String(content || '').trim(),
      is_read: false
    };
    if (!payload.content) throw new Error('メッセージを入力してください');
    var r = await client.from('messages').insert(payload).select().single();
    if (r.error) throw r.error;
    return r.data;
  }

  function subscribeMessages(matchingId, onInsert) {
    var ch = client
      .channel('messages-' + matchingId)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: 'matching_id=eq.' + matchingId
      }, function(payload){ onInsert(payload.new); })
      .subscribe();
    return function unsubscribe(){ try { client.removeChannel(ch); } catch(e){} };
  }

  // ---------- Admin ----------
  async function isAdmin() {
    var user = await getUser();
    if (!user) return false;
    var r = await client.from('admin_users').select('id').eq('auth_user_id', user.id).maybeSingle();
    return !!(r.data);
  }

  async function adminListCompanies() {
    var r = await client.from('companies').select('*').order('created_at', { ascending: false });
    if (r.error) throw r.error;
    return r.data || [];
  }

  async function adminListProfessionals() {
    var r = await client.from('professionals').select('*').order('created_at', { ascending: false });
    if (r.error) throw r.error;
    return r.data || [];
  }

  async function adminListMatchings() {
    var r = await client.from('matchings')
      .select('*,companies(id,name),professionals(id,name)')
      .order('created_at', { ascending: false });
    if (r.error) throw r.error;
    return r.data || [];
  }

  async function adminCreateMatching(companyId, professionalId, matchScore) {
    var r = await client.from('matchings').insert({
      company_id: companyId,
      professional_id: professionalId,
      match_score: matchScore || null,
      status: 'proposed'
    }).select().single();
    if (r.error) throw r.error;
    return r.data;
  }

  async function adminUpdateCompanyStatus(id, status) {
    var r = await client.from('companies').update({ status: status }).eq('id', id).select().single();
    if (r.error) throw r.error;
    return r.data;
  }

  async function adminUpdateProfessionalStatus(id, status) {
    var r = await client.from('professionals').update({ status: status }).eq('id', id).select().single();
    if (r.error) throw r.error;
    return r.data;
  }

  // ---------- Registration (anon insert) ----------
  async function registerCompany(payload) {
    var r = await client.from('companies').insert(payload).select().single();
    if (r.error) throw r.error;
    return r.data;
  }

  async function registerProfessional(payload) {
    var r = await client.from('professionals').insert(payload).select().single();
    if (r.error) throw r.error;
    return r.data;
  }

  window.CSLINK = {
    client: client,
    auth: {
      sendMagicLink: sendMagicLink,
      getSession: getSession,
      getUser: getUser,
      signOut: signOut,
      onAuthChange: onAuthChange
    },
    company: {
      fetchMine: fetchMyCompany,
      linkByEmail: linkCompanyByEmail,
      register: registerCompany
    },
    professional: {
      fetchMine: fetchMyProfessional,
      linkByEmail: linkProfessionalByEmail,
      register: registerProfessional,
      listApproved: listApprovedProfessionals,
      getPublic: getProfessionalPublic
    },
    matching: {
      listAsCompany: listMyMatchingsAsCompany,
      listAsProfessional: listMyMatchingsAsProfessional,
      updateStatus: updateMatchingStatus
    },
    message: {
      list: listMessages,
      send: sendMessage,
      subscribe: subscribeMessages
    },
    admin: {
      isAdmin: isAdmin,
      listCompanies: adminListCompanies,
      listProfessionals: adminListProfessionals,
      listMatchings: adminListMatchings,
      createMatching: adminCreateMatching,
      updateCompanyStatus: adminUpdateCompanyStatus,
      updateProfessionalStatus: adminUpdateProfessionalStatus
    }
  };
})();
