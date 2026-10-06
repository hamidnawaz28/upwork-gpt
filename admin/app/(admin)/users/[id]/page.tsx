import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PlanBadge, Quota, Stat } from '@/components/ui'
import { adminDb, unwrap, type AdminProposal, type AdminUser } from '@/lib/db'
import { formatDate, formatDateTime, formatNumber, timeAgo } from '@/lib/format'

export default async function UserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()

  const db = await adminDb()
  const [user, proposals] = await Promise.all([
    db.from('copalat_admin_users').select('*').eq('id', id).maybeSingle().then(unwrap<AdminUser | null>),
    db
      .from('copalat_admin_proposals')
      .select('*')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(100)
      .then(unwrap<AdminProposal[]>),
  ])
  if (!user) notFound()

  return (
    <>
      <p className="crumb">
        <Link href="/users">← Users</Link>
      </p>
      <div className="profile">
        {user.avatar_url ? (
          <img src={user.avatar_url} alt="" className="avatar avatar-large" referrerPolicy="no-referrer" />
        ) : (
          <span className="avatar avatar-large avatar-empty">
            {(user.full_name || user.email || '?').charAt(0).toUpperCase()}
          </span>
        )}
        <div>
          <h1>{user.full_name || user.email}</h1>
          <p className="muted">{user.email}</p>
        </div>
        <PlanBadge user={user} />
      </div>

      <section className="stats">
        <Stat label="Proposals written" value={formatNumber(user.proposals_total)} />
        <Stat label="Last proposal" value={timeAgo(user.last_proposal_at)} />
        <Stat
          label="Last sign in"
          value={timeAgo(user.last_sign_in_at)}
          hint={`Joined ${formatDate(user.created_at)}`}
        />
        <Stat label="Free proposals used" value={`${formatNumber(user.trial_used)} of 5`} />
      </section>

      <div className="columns">
        <section className="card">
          <div className="card-head">
            <h2>Plan</h2>
          </div>
          <dl>
            <dt>Plan</dt>
            <dd>
              <PlanBadge user={user} />
            </dd>
            <dt>{user.is_paid ? 'Used this period' : 'Free proposals'}</dt>
            <dd>
              <Quota user={user} />
            </dd>
            <dt>Stripe status</dt>
            <dd>{user.billing_status || '—'}</dd>
            <dt>{user.cancel_at_period_end ? 'Ends on' : 'Renews on'}</dt>
            <dd>{formatDate(user.current_period_end)}</dd>
            <dt>Stripe customer</dt>
            <dd>
              {user.stripe_customer_id ? (
                <a
                  href={`https://dashboard.stripe.com/customers/${user.stripe_customer_id}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {user.stripe_customer_id}
                </a>
              ) : (
                '—'
              )}
            </dd>
          </dl>
        </section>

        <section className="card">
          <div className="card-head">
            <h2>Freelancer profile</h2>
          </div>
          {user.about ? (
            <p className="proposal">{user.about}</p>
          ) : (
            <p className="empty">This user has not filled in a profile.</p>
          )}
        </section>
      </div>

      <section className="card">
        <div className="card-head">
          <h2>
            Proposals <span className="count">{formatNumber(proposals.length)}</span>
          </h2>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Job</th>
                <th>Tone</th>
                <th>Length</th>
                <th className="num">Answers</th>
                <th>Written</th>
              </tr>
            </thead>
            <tbody>
              {proposals.map((p) => (
                <tr key={p.id}>
                  <td data-label="Job" className="clamp">
                    <Link href={`/proposals/${p.id}`}>{p.job_title || p.content}</Link>
                  </td>
                  <td data-label="Tone" className="muted">
                    {p.tone || '—'}
                  </td>
                  <td data-label="Length" className="muted">
                    {p.length || '—'}
                  </td>
                  <td data-label="Answers" className="num">
                    {formatNumber(p.answers?.length)}
                  </td>
                  <td data-label="Written" className="muted">
                    {formatDateTime(p.created_at)}
                  </td>
                </tr>
              ))}
              {!proposals.length && (
                <tr>
                  <td colSpan={5} className="empty">
                    This user has not written a proposal.
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
