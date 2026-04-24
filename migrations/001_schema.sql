-- CSLINK 本番スキーマ migration
-- 実行方法: Supabase ダッシュボード > SQL Editor > New query > 下記を貼り付け > Run
-- 冪等: 既に列・ポリシー・triggerが存在する場合はスキップされる

-- ========================================================================
-- 1. 既存テーブルへの auth 連携列追加
-- ========================================================================
alter table public.companies      add column if not exists auth_user_id uuid references auth.users(id) on delete set null;
alter table public.professionals  add column if not exists auth_user_id uuid references auth.users(id) on delete set null;

create index if not exists companies_auth_user_id_idx     on public.companies(auth_user_id);
create index if not exists professionals_auth_user_id_idx on public.professionals(auth_user_id);
create index if not exists companies_email_idx            on public.companies(email);
create index if not exists professionals_email_idx        on public.professionals(email);
create index if not exists professionals_status_idx       on public.professionals(status);

-- ========================================================================
-- 2. admin_users テーブル整備
-- ========================================================================
alter table public.admin_users add column if not exists auth_user_id uuid references auth.users(id) on delete cascade;
alter table public.admin_users add column if not exists email        text;
alter table public.admin_users add column if not exists name         text;
alter table public.admin_users add column if not exists created_at   timestamptz not null default now();

create unique index if not exists admin_users_auth_user_id_uk on public.admin_users(auth_user_id) where auth_user_id is not null;
create unique index if not exists admin_users_email_uk        on public.admin_users(lower(email)) where email is not null;

-- ========================================================================
-- 3. messages / matchings の制約・インデックス
-- ========================================================================
create index if not exists matchings_company_id_idx      on public.matchings(company_id);
create index if not exists matchings_professional_id_idx on public.matchings(professional_id);
create index if not exists messages_matching_id_idx      on public.messages(matching_id);
create index if not exists messages_created_at_idx       on public.messages(created_at);

-- ========================================================================
-- 4. 更新日時自動更新トリガー
-- ========================================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end$$;

drop trigger if exists trg_companies_updated     on public.companies;
create trigger trg_companies_updated      before update on public.companies     for each row execute function public.set_updated_at();

drop trigger if exists trg_professionals_updated on public.professionals;
create trigger trg_professionals_updated  before update on public.professionals for each row execute function public.set_updated_at();

drop trigger if exists trg_matchings_updated     on public.matchings;
create trigger trg_matchings_updated      before update on public.matchings     for each row execute function public.set_updated_at();

-- ========================================================================
-- 5. admin判定ヘルパー関数
-- ========================================================================
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users
    where auth_user_id = auth.uid()
  );
$$;

grant execute on function public.is_admin() to anon, authenticated;

-- ========================================================================
-- 6. RLS 有効化
-- ========================================================================
alter table public.companies     enable row level security;
alter table public.professionals enable row level security;
alter table public.matchings     enable row level security;
alter table public.messages      enable row level security;
alter table public.admin_users   enable row level security;

-- ========================================================================
-- 7. ポリシー: companies
-- ========================================================================
drop policy if exists companies_anon_insert     on public.companies;
drop policy if exists companies_owner_select    on public.companies;
drop policy if exists companies_owner_update    on public.companies;
drop policy if exists companies_admin_all       on public.companies;

-- 匿名でも登録フォームから INSERT を許可（status/source は任意）
create policy companies_anon_insert on public.companies
  for insert to anon, authenticated
  with check (true);

-- 本人はログイン後 auth_user_id で自社レコードを参照可能。email一致の未紐付けレコードも参照可能（紐付け用）
create policy companies_owner_select on public.companies
  for select to authenticated
  using (
    auth_user_id = auth.uid()
    or (auth_user_id is null and lower(email) = lower(auth.jwt() ->> 'email'))
  );

create policy companies_owner_update on public.companies
  for update to authenticated
  using (
    auth_user_id = auth.uid()
    or (auth_user_id is null and lower(email) = lower(auth.jwt() ->> 'email'))
  )
  with check (
    auth_user_id = auth.uid()
    or (auth_user_id is null and lower(email) = lower(auth.jwt() ->> 'email'))
  );

create policy companies_admin_all on public.companies
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ========================================================================
-- 8. ポリシー: professionals
-- ========================================================================
drop policy if exists professionals_anon_insert       on public.professionals;
drop policy if exists professionals_public_approved   on public.professionals;
drop policy if exists professionals_owner_select      on public.professionals;
drop policy if exists professionals_owner_update      on public.professionals;
drop policy if exists professionals_admin_all         on public.professionals;

create policy professionals_anon_insert on public.professionals
  for insert to anon, authenticated
  with check (true);

-- 公開リスト: approved のみ匿名でも読める
create policy professionals_public_approved on public.professionals
  for select to anon, authenticated
  using (status = 'approved');

create policy professionals_owner_select on public.professionals
  for select to authenticated
  using (
    auth_user_id = auth.uid()
    or (auth_user_id is null and lower(email) = lower(auth.jwt() ->> 'email'))
  );

create policy professionals_owner_update on public.professionals
  for update to authenticated
  using (
    auth_user_id = auth.uid()
    or (auth_user_id is null and lower(email) = lower(auth.jwt() ->> 'email'))
  )
  with check (
    auth_user_id = auth.uid()
    or (auth_user_id is null and lower(email) = lower(auth.jwt() ->> 'email'))
  );

create policy professionals_admin_all on public.professionals
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ========================================================================
-- 9. ポリシー: matchings
-- ========================================================================
drop policy if exists matchings_member_select on public.matchings;
drop policy if exists matchings_member_update on public.matchings;
drop policy if exists matchings_admin_all     on public.matchings;

create policy matchings_member_select on public.matchings
  for select to authenticated
  using (
    company_id in (select id from public.companies where auth_user_id = auth.uid())
    or professional_id in (select id from public.professionals where auth_user_id = auth.uid())
    or public.is_admin()
  );

create policy matchings_member_update on public.matchings
  for update to authenticated
  using (
    company_id in (select id from public.companies where auth_user_id = auth.uid())
    or professional_id in (select id from public.professionals where auth_user_id = auth.uid())
    or public.is_admin()
  )
  with check (
    company_id in (select id from public.companies where auth_user_id = auth.uid())
    or professional_id in (select id from public.professionals where auth_user_id = auth.uid())
    or public.is_admin()
  );

create policy matchings_admin_all on public.matchings
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ========================================================================
-- 10. ポリシー: messages
-- ========================================================================
drop policy if exists messages_member_select on public.messages;
drop policy if exists messages_member_insert on public.messages;
drop policy if exists messages_admin_all     on public.messages;

create policy messages_member_select on public.messages
  for select to authenticated
  using (
    matching_id in (
      select m.id from public.matchings m
      where m.company_id in (select id from public.companies where auth_user_id = auth.uid())
         or m.professional_id in (select id from public.professionals where auth_user_id = auth.uid())
    )
    or public.is_admin()
  );

create policy messages_member_insert on public.messages
  for insert to authenticated
  with check (
    matching_id in (
      select m.id from public.matchings m
      where m.company_id in (select id from public.companies where auth_user_id = auth.uid())
         or m.professional_id in (select id from public.professionals where auth_user_id = auth.uid())
    )
    or public.is_admin()
  );

create policy messages_admin_all on public.messages
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ========================================================================
-- 11. ポリシー: admin_users
-- ========================================================================
drop policy if exists admin_users_self_select on public.admin_users;
drop policy if exists admin_users_admin_all   on public.admin_users;

-- 自分が管理者かどうか判定するために自レコードだけ読める
create policy admin_users_self_select on public.admin_users
  for select to authenticated
  using (auth_user_id = auth.uid() or public.is_admin());

create policy admin_users_admin_all on public.admin_users
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ========================================================================
-- 12. messages をリアルタイム publication に追加
-- ========================================================================
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
  ) then
    execute 'alter publication supabase_realtime add table public.messages';
  end if;
end$$;

-- ========================================================================
-- 13. 初期管理者登録ヘルパー
-- ========================================================================
-- このSQL実行後、ダッシュボードの Authentication > Users から管理者にしたいメールを招待するか
-- 以下の手順:
--   1) Authentication > Users > Add user で管理者のメールアドレスを追加（または Magic Link で一度ログイン）
--   2) 下記SQLを実行（your-admin@facing.co.jp を実際のメールに置換）:
--
--      insert into public.admin_users (auth_user_id, email, name)
--      select id, email, 'Admin'
--        from auth.users
--       where email = 'your-admin@facing.co.jp'
--      on conflict do nothing;
