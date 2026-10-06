-- Data for the admin dashboard (admin/). Everything is read with the service role key:
-- the views run with the caller's permissions (security_invoker) and anon / authenticated
-- have no access to them.

-- Name, picture and sign-in times of every user, copied from auth.users (which the
-- service role cannot read directly).
create table public.copalat_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  last_sign_in_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.copalat_profiles enable row level security;
revoke all on public.copalat_profiles from anon, authenticated;

create function public.copalat_sync_profile() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.copalat_profiles (id, email, full_name, avatar_url, created_at, last_sign_in_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture'),
    coalesce(new.created_at, now()),
    new.last_sign_in_at
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = excluded.full_name,
    avatar_url = excluded.avatar_url,
    last_sign_in_at = excluded.last_sign_in_at,
    updated_at = now();
  return new;
end;
$$;

revoke execute on function public.copalat_sync_profile() from public, anon, authenticated;

create trigger copalat_on_auth_user_saved
  after insert or update of email, raw_user_meta_data, last_sign_in_at on auth.users
  for each row execute function public.copalat_sync_profile();

insert into public.copalat_profiles (id, email, full_name, avatar_url, created_at, last_sign_in_at)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name'),
  coalesce(u.raw_user_meta_data ->> 'avatar_url', u.raw_user_meta_data ->> 'picture'),
  u.created_at,
  u.last_sign_in_at
from auth.users u
on conflict (id) do nothing;

-- One row per signed-in user: profile, plan, quota and proposal totals.
create view public.copalat_admin_users with (security_invoker = true) as
select
  p.id,
  p.email,
  p.full_name,
  p.avatar_url,
  p.created_at,
  p.last_sign_in_at,
  s.is_paid,
  case when s.is_paid then a.plan end as plan,
  a.status as billing_status,
  a.current_period_end,
  coalesce(a.cancel_at_period_end, false) as cancel_at_period_end,
  a.stripe_customer_id,
  coalesce(a.trial_used, 0) as trial_used,
  case when s.is_paid then a.period_used else coalesce(a.trial_used, 0) end as quota_used,
  case when s.is_paid then public.copalat_plan_limit(a.plan) else public.copalat_trial_limit() end as quota_limit,
  coalesce(a.about, '') <> '' as has_profile,
  coalesce(a.about, '') as about,
  coalesce(g.proposals_total, 0) as proposals_total,
  g.last_proposal_at
from public.copalat_profiles p
left join public.copalat_accounts a on a.user_id = p.id
cross join lateral (
  select coalesce(
    a.plan is not null
      and a.status in ('active', 'trialing')
      and (a.current_period_end is null or a.current_period_end > now()),
    false
  ) as is_paid
) s
left join (
  select user_id, count(*) as proposals_total, max(created_at) as last_proposal_at
  from public.copalat_proposals
  group by user_id
) g on g.user_id = p.id;

-- Every generated proposal with its author's email and name.
create view public.copalat_admin_proposals with (security_invoker = true) as
select g.*, p.email, p.full_name, p.avatar_url
from public.copalat_proposals g
left join public.copalat_profiles p on p.id = g.user_id;

-- Single row of totals for the overview page.
create view public.copalat_admin_stats with (security_invoker = true) as
select
  (select count(*) from public.copalat_admin_users) as users_total,
  (select count(*) from public.copalat_admin_users where created_at > now() - interval '7 days') as users_new_7d,
  (select count(*) from public.copalat_admin_users where last_proposal_at > now() - interval '7 days') as users_active_7d,
  (select count(*) from public.copalat_admin_users where proposals_total > 0) as users_activated,
  (select count(*) from public.copalat_admin_users where has_profile) as users_with_profile,
  (select count(*) from public.copalat_admin_users where is_paid) as paid_total,
  (select count(*) from public.copalat_admin_users where is_paid and plan = 'starter') as paid_starter,
  (select count(*) from public.copalat_admin_users where is_paid and plan = 'pro') as paid_pro,
  (select count(*) from public.copalat_admin_users where is_paid and cancel_at_period_end) as paid_cancelling,
  (select count(*) from public.copalat_admin_users where billing_status in ('past_due', 'unpaid')) as payment_failing,
  (select count(*) from public.copalat_admin_users where not is_paid and trial_used >= public.copalat_trial_limit()) as trial_ended,
  (select count(*) from public.copalat_proposals) as proposals_total,
  (select count(*) from public.copalat_proposals where created_at > now() - interval '24 hours') as proposals_24h,
  (select count(*) from public.copalat_proposals where created_at > now() - interval '7 days') as proposals_7d;

-- Sign-ups and proposals per day (UTC) for the last 30 days, oldest first.
create view public.copalat_admin_daily with (security_invoker = true) as
select
  d.day::date as day,
  (select count(*) from public.copalat_profiles p where p.created_at >= d.day and p.created_at < d.day + interval '1 day') as signups,
  (select count(*) from public.copalat_proposals g where g.created_at >= d.day and g.created_at < d.day + interval '1 day') as proposals
from generate_series(
  date_trunc('day', now() at time zone 'utc') - interval '29 days',
  date_trunc('day', now() at time zone 'utc'),
  interval '1 day'
) as d (day)
order by d.day;

revoke all on
  public.copalat_admin_users,
  public.copalat_admin_proposals,
  public.copalat_admin_stats,
  public.copalat_admin_daily
from public, anon, authenticated;

grant select on
  public.copalat_admin_users,
  public.copalat_admin_proposals,
  public.copalat_admin_stats,
  public.copalat_admin_daily
to service_role;
