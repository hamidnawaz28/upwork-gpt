import Link from 'next/link'
import { Pager, UserCell } from '@/components/ui'
import { adminDb, type AdminProposal } from '@/lib/db'
import { formatNumber, timeAgo } from '@/lib/format'

const PAGE_SIZE = 50

type Search = { page?: string; q?: string }

export default async function ProposalsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams
  const page = Math.max(0, Number(params.page) || 0)
  // Commas and parentheses would break PostgREST's or() filter syntax.
  const q = (params.q || '').replace(/[,()*%\\]/g, ' ').trim()

  const db = await adminDb()
  let query = db.from('copalat_admin_proposals').select('*', { count: 'exact' })
  if (q) query = query.or(`job_title.ilike.%${q}%,email.ilike.%${q}%`)

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1)
  if (error) throw new Error(error.message)
  const proposals = (data || []) as AdminProposal[]

  const href = (nextPage: number) => {
    const search = new URLSearchParams()
    if (q) search.set('q', q)
    if (nextPage) search.set('page', String(nextPage))
    const text = search.toString()
    return text ? `/proposals?${text}` : '/proposals'
  }

  return (
    <>
      <h1>
        Proposals <span className="count">{formatNumber(count)}</span>
      </h1>

      <div className="toolbar">
        <p className="muted">Every proposal the extension has written, newest first.</p>
        <form action="/proposals" className="search">
          <input type="search" name="q" defaultValue={q} placeholder="Search job title or email" />
          <button type="submit">Search</button>
        </form>
      </div>

      <section className="card">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>User</th>
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
                  <td data-label="User">
                    <UserCell id={p.user_id} email={p.email} name={p.full_name} avatar={p.avatar_url} />
                  </td>
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
                    {timeAgo(p.created_at)}
                  </td>
                </tr>
              ))}
              {!proposals.length && (
                <tr>
                  <td colSpan={6} className="empty">
                    No proposals match.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pager page={page} pageSize={PAGE_SIZE} total={count || 0} href={href} />
      </section>
    </>
  )
}
