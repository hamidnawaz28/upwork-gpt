-- A freelancer can keep several named profiles (e.g. "Shopify", "Data cleaning"), pick one
-- per proposal and mark one as the default. Also keeps the job text with each proposal so
-- the admin can see what a proposal was written for.

create table public.copalat_freelancer_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  about text not null default '',
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index copalat_freelancer_profiles_user_idx on public.copalat_freelancer_profiles (user_id, created_at);
-- At most one default per user.
create unique index copalat_freelancer_profiles_one_default
  on public.copalat_freelancer_profiles (user_id) where is_default;

alter table public.copalat_freelancer_profiles enable row level security;
revoke all on public.copalat_freelancer_profiles from anon, authenticated;

create trigger copalat_freelancer_profiles_set_updated_at
  before update on public.copalat_freelancer_profiles
  for each row execute function public.copalat_set_updated_at();

-- The single profile each account had becomes its first, default profile.
insert into public.copalat_freelancer_profiles (user_id, name, about, is_default)
select user_id, 'Main profile', about, true
from public.copalat_accounts
where about <> '';

-- Makes p_default the user's default profile (or keeps the current one when null), makes
-- sure a user with profiles always has exactly one default, and mirrors the default's text
-- into copalat_accounts.about, which the account summary and the admin views read.
create function public.copalat_sync_default_profile(p_user uuid, p_default uuid) returns void
language plpgsql set search_path = ''
as $$
begin
  if p_default is not null
    and exists (select 1 from public.copalat_freelancer_profiles where id = p_default and user_id = p_user) then
    -- Two steps, so the one-default index is never violated part way through.
    update public.copalat_freelancer_profiles set is_default = false
    where user_id = p_user and is_default and id <> p_default;
    update public.copalat_freelancer_profiles set is_default = true
    where id = p_default and user_id = p_user and not is_default;
  end if;

  if not exists (select 1 from public.copalat_freelancer_profiles where user_id = p_user and is_default) then
    update public.copalat_freelancer_profiles set is_default = true
    where id = (
      select id from public.copalat_freelancer_profiles
      where user_id = p_user order by created_at limit 1
    );
  end if;

  update public.copalat_accounts set about = coalesce(
    (select about from public.copalat_freelancer_profiles where user_id = p_user and is_default), ''
  )
  where user_id = p_user;
end;
$$;

revoke execute on function public.copalat_sync_default_profile(uuid, uuid) from public, anon, authenticated;
grant execute on function public.copalat_sync_default_profile(uuid, uuid) to service_role;

-- What each proposal was written for and with.
alter table public.copalat_proposals
  add column job_description text,
  add column job_skills jsonb not null default '[]'::jsonb,
  add column instructions text,
  add column profile_name text;

-- The view lists the table's columns, so it has to be rebuilt to pick up the new ones.
drop view public.copalat_admin_proposals;
create view public.copalat_admin_proposals with (security_invoker = true) as
select g.*, p.email, p.full_name, p.avatar_url
from public.copalat_proposals g
left join public.copalat_profiles p on p.id = g.user_id;

revoke all on public.copalat_admin_proposals from public, anon, authenticated;
grant select on public.copalat_admin_proposals to service_role;
