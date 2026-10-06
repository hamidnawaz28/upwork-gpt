-- Third paid plan: Unlimited, $99 a month, with no monthly cap on proposals.

alter table public.copalat_accounts drop constraint if exists copalat_accounts_plan_check;
alter table public.copalat_accounts
  add constraint copalat_accounts_plan_check check (plan in ('starter', 'pro', 'unlimited'));

-- "Unlimited" is a quota no one can reach, so the same counting code serves every plan.
create or replace function public.copalat_plan_limit(p_plan text) returns integer
language sql immutable set search_path = ''
as $$ select case p_plan when 'starter' then 30 when 'pro' then 60 when 'unlimited' then 1000000 else 0 end $$;

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
    'unlimited', q.active and a.plan = 'unlimited',
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

-- Adds the Unlimited count for the admin's revenue estimate (new column goes last).
create or replace view public.copalat_admin_stats with (security_invoker = true) as
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
  (select count(*) from public.copalat_proposals where created_at > now() - interval '7 days') as proposals_7d,
  (select count(*) from public.copalat_admin_users where is_paid and plan = 'unlimited') as paid_unlimited;
