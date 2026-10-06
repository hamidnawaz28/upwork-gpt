import Link from 'next/link'
import { DailyChart, Funnel, PageHead, PlanBadge, Quota, Stat, UserCell } from '@/components/ui'
import {
  adminDb,
  PLAN_PRICES,
  unwrap,
  type AdminDay,
  type AdminProposal,
  type AdminStats,
  type AdminUser,
} from '@/lib/db'
import { formatDate, formatNumber, formatPercent, timeAgo } from '@/lib/format'

export default async function OverviewPage() {
  const db = await adminDb()
  const [stats, days, signups, paid, proposals] = await Promise.all([
    db.from('copalat_admin_stats').select('*').single().then(unwrap<AdminStats>),
    db.from('copalat_admin_daily').select('*').order('day').then(unwrap<AdminDay[]>),
    db
      .from('copalat_admin_users')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(6)
      .then(unwrap<AdminUser[]>),
    db
      .from('copalat_admin_users')
      .select('*')
      .eq('is_paid', true)
      .order('current_period_end', { ascending: false, nullsFirst: false })
      .limit(6)
      .then(unwrap<AdminUser[]>),
    db
      .from('copalat_admin_proposals')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(8)
      .then(unwrap<AdminProposal[]>),
  ])

  const mrr = stats.paid_starter * PLAN_PRICES.starter + stats.paid_pro * PLAN_PRICES.pro
  const freeUsers = stats.users_total - stats.paid_total
  // Everyone paying has been through the trial, so they count as having used it up.
  const funnel = [
    { label: 'Signed in', value: stats.users_total },
    { label: 'Wrote a proposal', value: stats.users_activated },
    { label: 'Used all free proposals', value: stats.trial_ended + stats.paid_total },
    { label: 'Paying', value: stats.paid_total },
  ]

  return (
    <>
      <PageHead title="Overview">
        <p className="muted">How Copalat is doing right now.</p>
      </PageHead>

      <section className="stats">
        <Stat
          accent
          icon="dollar"
          label="Est. monthly revenue"
          value={`$${formatNumber(mrr)}`}
          hint="Active plans at list prices"
        />
        <Stat
          icon="card"
          label="Paid users"
          value={formatNumber(stats.paid_total)}
          hint={`${formatPercent(stats.paid_total, stats.users_total)} of users · ${formatNumber(stats.paid_cancelling)} cancelling`}
        />
        <Stat
          icon="users"
          label="Signed-in users"
          value={formatNumber(stats.users_total)}
          hint={`${formatNumber(stats.users_new_7d)} new in 7 days`}
        />
        <Stat
          icon="spark"
          label="Proposals written"
          value={formatNumber(stats.proposals_total)}
          hint={`${formatNumber(stats.proposals_24h)} in 24h · ${formatNumber(stats.proposals_7d)} in 7 days`}
        />
      </section>

      <div className="columns columns-wide">
        <section className="card">
          <div className="card-head">
            <h2>Last 30 days</h2>
          </div>
          <DailyChart days={days} />
        </section>

        <section className="card">
          <div className="card-head">
            <h2>Conversion funnel</h2>
          </div>
          <Funnel stages={funnel} />
        </section>
      </div>

      <section className="stats stats-small">
        <Stat label={`Starter ($${PLAN_PRICES.starter})`} value={formatNumber(stats.paid_starter)} />
        <Stat label={`Pro ($${PLAN_PRICES.pro})`} value={formatNumber(stats.paid_pro)} />
        <Stat
          label="Free users"
          value={formatNumber(freeUsers)}
          hint={`${formatNumber(stats.trial_ended)} out of free proposals`}
        />
        <Stat label="Active (7 days)" value={formatNumber(stats.users_active_7d)} hint="Wrote a proposal" />
        <Stat label="Filled in a profile" value={formatPercent(stats.users_with_profile, stats.users_total)} />
        <Stat label="Payment failing" value={formatNumber(stats.payment_failing)} />
      </section>

      <div className="columns">
        <section className="card">
          <div className="card-head">
            <h2>Newest users</h2>
            <Link href="/users">All users →</Link>
          </div>
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Plan</th>
                <th>Quota</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {signups.map((user) => (
                <tr key={user.id}>
                  <td data-label="User">
                    <UserCell id={user.id} email={user.email} name={user.full_name} avatar={user.avatar_url} />
                  </td>
                  <td data-label="Plan">
                    <PlanBadge user={user} />
                  </td>
                  <td data-label="Quota">
                    <Quota user={user} />
                  </td>
                  <td data-label="Joined" className="muted">
                    {timeAgo(user.created_at)}
                  </td>
                </tr>
              ))}
              {!signups.length && (
                <tr>
                  <td colSpan={4} className="empty">
                    No users yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <section className="card">
          <div className="card-head">
            <h2>Paid users</h2>
            <Link href="/users?plan=paid">All paid users →</Link>
          </div>
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Plan</th>
                <th>Renews / ends</th>
              </tr>
            </thead>
            <tbody>
              {paid.map((user) => (
                <tr key={user.id}>
                  <td data-label="User">
                    <UserCell id={user.id} email={user.email} name={user.full_name} avatar={user.avatar_url} />
                  </td>
                  <td data-label="Plan">
                    <PlanBadge user={user} />
                  </td>
                  <td data-label="Renews / ends" className="muted">
                    {formatDate(user.current_period_end)}
                  </td>
                </tr>
              ))}
              {!paid.length && (
                <tr>
                  <td colSpan={3} className="empty">
                    No paid users yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </div>

      <section className="card">
        <div className="card-head">
          <h2>Latest proposals</h2>
          <Link href="/proposals">All proposals →</Link>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Job</th>
                <th>Written</th>
              </tr>
            </thead>
            <tbody>
              {proposals.map((p) => (
                <tr key={p.id}>
                  <td data-label="User">
                    <UserCell id={p.user_id} email={p.email} name={p.full_name} avatar={p.avatar_url} />
                  </td>
                  <td data-label="Job" className="clamp">
                    <Link href={`/proposals/${p.id}`}>{p.job_title || p.content}</Link>
                  </td>
                  <td data-label="Written" className="muted">
                    {timeAgo(p.created_at)}
                  </td>
                </tr>
              ))}
              {!proposals.length && (
                <tr>
                  <td colSpan={3} className="empty">
                    No proposals yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
