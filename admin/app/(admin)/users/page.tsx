import Link from 'next/link'
import { Pager, PlanBadge, Quota, UserCell } from '@/components/ui'
import { adminDb, type AdminUser } from '@/lib/db'
import { formatDate, formatNumber, timeAgo } from '@/lib/format'

const PAGE_SIZE = 25

const PLANS = [
  { id: 'all', label: 'All' },
  { id: 'paid', label: 'Paid' },
  { id: 'free', label: 'Free' },
  { id: 'limit', label: 'Free proposals used up' },
  { id: 'failing', label: 'Payment failing' },
] as const

// One entry per table column, in display order. `dir` is the direction a
// column sorts in when first clicked; clicking it again flips it.
const SORTS = {
  user: { label: 'User', columns: ['email'], dir: 'asc', num: false },
  plan: { label: 'Plan', columns: ['is_paid', 'plan'], dir: 'desc', num: false },
  quota: { label: 'Quota', columns: ['quota_used'], dir: 'desc', num: false },
  proposals: { label: 'Proposals', columns: ['proposals_total'], dir: 'desc', num: true },
  activity: { label: 'Last proposal', columns: ['last_proposal_at'], dir: 'desc', num: false },
  signin: { label: 'Last sign in', columns: ['last_sign_in_at'], dir: 'desc', num: false },
  joined: { label: 'Joined', columns: ['created_at'], dir: 'desc', num: false },
} as const

type SortKey = keyof typeof SORTS
type Search = { plan?: string; sort?: string; dir?: string; q?: string; page?: string }

export default async function UsersPage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams
  const plan = PLANS.some((p) => p.id === params.plan) ? params.plan! : 'all'
  const sort = (params.sort && params.sort in SORTS ? params.sort : 'joined') as SortKey
  const dir = params.dir === 'asc' || params.dir === 'desc' ? params.dir : SORTS[sort].dir
  const page = Math.max(0, Number(params.page) || 0)
  // Commas and parentheses would break PostgREST's or() filter syntax.
  const q = (params.q || '').replace(/[,()*%\\]/g, ' ').trim()

  const db = await adminDb()
  let query = db.from('copalat_admin_users').select('*', { count: 'exact' })
  if (plan === 'paid') query = query.eq('is_paid', true)
  if (plan === 'free') query = query.eq('is_paid', false)
  // Free users' quota is the trial, so a full quota means the trial is used up.
  if (plan === 'limit') query = query.eq('is_paid', false).gte('trial_used', 5)
  if (plan === 'failing') query = query.in('billing_status', ['past_due', 'unpaid'])
  if (q) query = query.or(`email.ilike.%${q}%,full_name.ilike.%${q}%`)

  for (const column of SORTS[sort].columns) {
    query = query.order(column, { ascending: dir === 'asc', nullsFirst: false })
  }
  // Keeps rows with equal values in a stable order across pages.
  const { data, count, error } = await query.order('id').range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1)
  if (error) throw new Error(error.message)
  const users = (data || []) as AdminUser[]

  const href = (next: Partial<Search>) => {
    const merged = { plan, sort, dir, q, page: '0', ...next }
    const search = new URLSearchParams()
    if (merged.plan !== 'all') search.set('plan', merged.plan)
    if (merged.sort !== 'joined') search.set('sort', merged.sort)
    if (merged.dir !== SORTS[merged.sort as SortKey].dir) search.set('dir', merged.dir)
    if (merged.q) search.set('q', merged.q)
    if (merged.page !== '0') search.set('page', merged.page)
    const text = search.toString()
    return text ? `/users?${text}` : '/users'
  }

  // The active column flips direction; any other column starts in its own default.
  const sortHref = (key: SortKey) =>
    href({ sort: key, dir: key === sort ? (dir === 'asc' ? 'desc' : 'asc') : SORTS[key].dir })
  const arrow = (key: SortKey) => (key === sort ? (dir === 'asc' ? ' ↑' : ' ↓') : '')

  return (
    <>
      <h1>
        Users <span className="count">{formatNumber(count)}</span>
      </h1>

      <div className="toolbar">
        <div className="tabs">
          {PLANS.map((p) => (
            <Link key={p.id} href={href({ plan: p.id })} className={p.id === plan ? 'tab tab-active' : 'tab'}>
              {p.label}
            </Link>
          ))}
        </div>
        <form action="/users" className="search">
          {plan !== 'all' && <input type="hidden" name="plan" value={plan} />}
          {sort !== 'joined' && <input type="hidden" name="sort" value={sort} />}
          {dir !== SORTS[sort].dir && <input type="hidden" name="dir" value={dir} />}
          <input type="search" name="q" defaultValue={q} placeholder="Search email or name" />
          <button type="submit">Search</button>
        </form>
      </div>

      {/* Phones hide the table header, so the same sort links are offered here. */}
      <div className="tabs tabs-small sort-tabs">
        <span className="muted">Sort:</span>
        {(Object.keys(SORTS) as SortKey[]).map((key) => (
          <Link key={key} href={sortHref(key)} className={key === sort ? 'tab tab-active' : 'tab'}>
            {SORTS[key].label}
            {arrow(key)}
          </Link>
        ))}
      </div>

      <section className="card">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                {(Object.keys(SORTS) as SortKey[]).map((key) => (
                  <th
                    key={key}
                    className={SORTS[key].num ? 'num' : undefined}
                    aria-sort={key === sort ? (dir === 'asc' ? 'ascending' : 'descending') : undefined}
                  >
                    <Link href={sortHref(key)} className={key === sort ? 'sort-link sort-active' : 'sort-link'}>
                      {SORTS[key].label}
                      {arrow(key)}
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
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
                  <td data-label="Proposals" className="num">
                    {formatNumber(user.proposals_total)}
                  </td>
                  <td data-label="Last proposal" className="muted">
                    {timeAgo(user.last_proposal_at)}
                  </td>
                  <td data-label="Last sign in" className="muted">
                    {timeAgo(user.last_sign_in_at)}
                  </td>
                  <td data-label="Joined" className="muted">
                    {formatDate(user.created_at)}
                  </td>
                </tr>
              ))}
              {!users.length && (
                <tr>
                  <td colSpan={7} className="empty">
                    No users match.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pager page={page} pageSize={PAGE_SIZE} total={count || 0} href={(p) => href({ page: String(p) })} />
      </section>
    </>
  )
}
