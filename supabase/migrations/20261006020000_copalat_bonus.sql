-- Extra proposals granted to an account by hand (testers, support gestures). They are
-- added to whichever allowance applies: the free trial, or the plan's monthly quota.
alter table public.copalat_accounts
  add column bonus_proposals integer not null default 0 check (bonus_proposals >= 0);

create or replace function public.copalat_account_json(a public.copalat_accounts) returns jsonb
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
      a.bonus_proposals + case when s.subscribed and not s.expired
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

-- The admin's user list shows the same allowance the extension enforces.
create or replace view public.copalat_admin_users with (security_invoker = true) as
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
  coalesce(a.bonus_proposals, 0)
    + case when s.is_paid then public.copalat_plan_limit(a.plan) else public.copalat_trial_limit() end as quota_limit,
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
