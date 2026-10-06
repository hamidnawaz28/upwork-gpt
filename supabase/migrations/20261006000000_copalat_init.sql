-- Copalat (Upwork proposal extension) data.
-- Everything is prefixed copalat_ so the schema can also live in a Supabase project that is
-- shared with another app.
-- All access goes through the "copalat" Edge Function with the service role: the tables
-- have RLS enabled with no policies and nothing is granted to anon / authenticated.

create table public.copalat_accounts (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text,
  -- free trial: lifetime count of generations made without a paid plan
  trial_used integer not null default 0,
  -- paid plan, written only from Stripe (checkout return, webhook, lazy sync)
  plan text check (plan in ('starter', 'pro')),
  status text,
  stripe_customer_id text unique,
  stripe_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  -- generations made in the current billing period
  period_used integer not null default 0,
  -- freelancer settings used to personalise proposals
  about text not null default '',
  tone text not null default 'professional',
  length text not null default 'medium',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.copalat_proposals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  job_url text,
  job_title text,
  tone text,
  length text,
  content text not null,
  answers jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index copalat_proposals_user_created_idx on public.copalat_proposals (user_id, created_at desc);

-- Remote config, so Upwork DOM changes can be fixed without shipping a new extension version.
create table public.copalat_config (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

insert into public.copalat_config (key, value) values (
  'selectors',
  '{
    "title": "",
    "description": ".description",
    "moreDescription": "button[data-ev-label=''truncation_toggle'']",
    "allTags": "[data-qa-skill-key]",
    "skillBadge": ".up-skill-badge",
    "coverLetter": ""
  }'::jsonb
);

alter table public.copalat_accounts enable row level security;
alter table public.copalat_proposals enable row level security;
alter table public.copalat_config enable row level security;

revoke all on public.copalat_accounts, public.copalat_proposals, public.copalat_config from anon, authenticated;

create function public.copalat_set_updated_at() returns trigger
language plpgsql set search_path = ''
as $$ begin new.updated_at = now(); return new; end; $$;

create trigger copalat_accounts_set_updated_at
  before update on public.copalat_accounts
  for each row execute function public.copalat_set_updated_at();

-- ---------- plans ----------
-- The only place the quotas live: 5 free trial generations, then 30 / 60 per billing month.

create function public.copalat_trial_limit() returns integer
language sql immutable set search_path = ''
as $$ select 5 $$;

create function public.copalat_plan_limit(p_plan text) returns integer
language sql immutable set search_path = ''
as $$ select case p_plan when 'starter' then 30 when 'pro' then 60 else 0 end $$;

-- What the extension shows for an account. "needs_sync" means the paid period has ended
-- and Stripe has to be asked whether it renewed before the plan can be used again.
create function public.copalat_account_json(a public.copalat_accounts) returns jsonb
language sql stable set search_path = ''
as $$
  with s as (
    select
      a.plan is not null and a.status in ('active', 'trialing') as subscribed,
      a.current_period_end is not null and a.current_period_end <= now() as expired
  ),
  q as (
    select
      s.subscribed and not s.expired as active,
      s.subscribed and s.expired as needs_sync,
      case when s.subscribed and not s.expired then a.period_used else a.trial_used end as used,
      case when s.subscribed and not s.expired
        then public.copalat_plan_limit(a.plan) else public.copalat_trial_limit() end as quota
    from s
  )
  select jsonb_build_object(
    'plan', case when q.active then a.plan else 'free' end,
    'active', q.active,
    'needs_sync', q.needs_sync,
    'used', q.used,
    'limit', q.quota,
    'remaining', greatest(q.quota - q.used, 0),
    'period_end', case when q.active then a.current_period_end end,
    'cancel_at_period_end', q.active and a.cancel_at_period_end,
    'has_customer', a.stripe_customer_id is not null,
    'settings', jsonb_build_object('about', a.about, 'tone', a.tone, 'length', a.length)
  )
  from q
$$;

create function public.copalat_get_account(p_user uuid, p_email text) returns jsonb
language plpgsql set search_path = ''
as $$
declare
  a public.copalat_accounts;
begin
  insert into public.copalat_accounts (user_id, email) values (p_user, p_email)
  on conflict (user_id) do nothing;
  select * into a from public.copalat_accounts where user_id = p_user;
  return public.copalat_account_json(a);
end;
$$;

-- Takes one generation from the user's allowance (paid period first, otherwise the trial).
-- The row lock makes concurrent requests queue up, so the limit cannot be raced past.
create function public.copalat_reserve_generation(p_user uuid, p_email text) returns jsonb
language plpgsql set search_path = ''
as $$
declare
  a public.copalat_accounts;
  v_info jsonb;
  v_bucket text;
begin
  insert into public.copalat_accounts (user_id, email) values (p_user, p_email)
  on conflict (user_id) do nothing;
  select * into a from public.copalat_accounts where user_id = p_user for update;
  v_info := public.copalat_account_json(a);

  if (v_info ->> 'needs_sync')::boolean then
    return jsonb_build_object('allowed', false, 'reason', 'needs_sync', 'account', v_info);
  end if;
  if (v_info ->> 'remaining')::integer <= 0 then
    return jsonb_build_object(
      'allowed', false,
      'reason', case when (v_info ->> 'active')::boolean then 'plan_limit' else 'trial_ended' end,
      'account', v_info
    );
  end if;

  if (v_info ->> 'active')::boolean then
    v_bucket := 'plan';
    update public.copalat_accounts set period_used = period_used + 1
    where user_id = p_user returning * into a;
  else
    v_bucket := 'trial';
    update public.copalat_accounts set trial_used = trial_used + 1
    where user_id = p_user returning * into a;
  end if;

  return jsonb_build_object('allowed', true, 'bucket', v_bucket, 'account', public.copalat_account_json(a));
end;
$$;

-- Gives a generation back when the AI call failed after it was reserved.
create function public.copalat_refund_generation(p_user uuid, p_bucket text) returns void
language sql set search_path = ''
as $$
  update public.copalat_accounts set
    period_used = case when p_bucket = 'plan' then greatest(period_used - 1, 0) else period_used end,
    trial_used = case when p_bucket = 'trial' then greatest(trial_used - 1, 0) else trial_used end
  where user_id = p_user
$$;

-- Records the state of a Stripe subscription. A new billing period resets the usage count.
create function public.copalat_apply_subscription(
  p_user uuid,
  p_customer text,
  p_subscription text,
  p_plan text,
  p_status text,
  p_period_start timestamptz,
  p_period_end timestamptz,
  p_cancel_at_period_end boolean
) returns void
language plpgsql set search_path = ''
as $$
declare
  a public.copalat_accounts;
begin
  insert into public.copalat_accounts (user_id) values (p_user) on conflict (user_id) do nothing;
  select * into a from public.copalat_accounts where user_id = p_user for update;

  -- A late event about an old, ended subscription must not cancel the current one.
  if a.stripe_subscription_id is not null
    and a.stripe_subscription_id <> p_subscription
    and a.status in ('active', 'trialing')
    and p_status not in ('active', 'trialing') then
    return;
  end if;

  update public.copalat_accounts set
    stripe_customer_id = coalesce(p_customer, stripe_customer_id),
    stripe_subscription_id = p_subscription,
    plan = coalesce(p_plan, plan),
    status = p_status,
    current_period_start = p_period_start,
    current_period_end = p_period_end,
    cancel_at_period_end = coalesce(p_cancel_at_period_end, false),
    period_used = case
      when current_period_start is distinct from p_period_start then 0 else period_used end
  where user_id = p_user;
end;
$$;

revoke execute on function
  public.copalat_set_updated_at(),
  public.copalat_trial_limit(),
  public.copalat_plan_limit(text),
  public.copalat_account_json(public.copalat_accounts),
  public.copalat_get_account(uuid, text),
  public.copalat_reserve_generation(uuid, text),
  public.copalat_refund_generation(uuid, text),
  public.copalat_apply_subscription(uuid, text, text, text, text, timestamptz, timestamptz, boolean)
from public, anon, authenticated;

grant execute on function
  public.copalat_trial_limit(),
  public.copalat_plan_limit(text),
  public.copalat_account_json(public.copalat_accounts),
  public.copalat_get_account(uuid, text),
  public.copalat_reserve_generation(uuid, text),
  public.copalat_refund_generation(uuid, text),
  public.copalat_apply_subscription(uuid, text, text, text, text, timestamptz, timestamptz, boolean)
to service_role;
