import Link from 'next/link'
import { notFound } from 'next/navigation'
import { UserCell } from '@/components/ui'
import { adminDb, unwrap, type AdminProposal } from '@/lib/db'
import { formatDateTime } from '@/lib/format'

export default async function ProposalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()

  const db = await adminDb()
  const proposal = await db
    .from('copalat_admin_proposals')
    .select('*')
    .eq('id', id)
    .maybeSingle()
    .then(unwrap<AdminProposal | null>)
  if (!proposal) notFound()

  // Stored as the path on upwork.com the proposal was written on.
  const jobUrl = proposal.job_url?.startsWith('/') ? `https://www.upwork.com${proposal.job_url}` : null

  return (
    <>
      <p className="crumb">
        <Link href="/proposals">← Proposals</Link>
      </p>
      <h1>{proposal.job_title || 'Proposal'}</h1>

      <section className="card">
        <dl>
          <dt>User</dt>
          <dd>
            <UserCell
              id={proposal.user_id}
              email={proposal.email}
              name={proposal.full_name}
              avatar={proposal.avatar_url}
            />
          </dd>
          <dt>Written</dt>
          <dd>{formatDateTime(proposal.created_at)}</dd>
          <dt>Tone / length</dt>
          <dd>
            {proposal.tone || '—'} / {proposal.length || '—'}
          </dd>
          <dt>Job page</dt>
          <dd>
            {jobUrl ? (
              <a href={jobUrl} target="_blank" rel="noreferrer">
                {proposal.job_url}
              </a>
            ) : (
              '—'
            )}
          </dd>
          <dt>Profile used</dt>
          <dd>{proposal.profile_name || 'None'}</dd>
          {proposal.instructions && (
            <>
              <dt>Extra instructions</dt>
              <dd>{proposal.instructions}</dd>
            </>
          )}
        </dl>
      </section>

      <section className="card">
        <div className="card-head">
          <h2>Cover letter</h2>
        </div>
        <p className="proposal">{proposal.content}</p>
      </section>

      <section className="card">
        <div className="card-head">
          <h2>Job post</h2>
          {proposal.job_skills?.length ? <span className="muted">{proposal.job_skills.join(' · ')}</span> : null}
        </div>
        {proposal.job_description ? (
          <p className="proposal">{proposal.job_description}</p>
        ) : (
          <p className="empty">The job text was not saved for proposals written before this was added.</p>
        )}
      </section>

      {proposal.answers?.map((item, index) => (
        <section className="card" key={index}>
          <div className="card-head">
            <h2>{item.question || `Question ${index + 1}`}</h2>
          </div>
          <p className="proposal">{item.answer}</p>
        </section>
      ))}
    </>
  )
}
