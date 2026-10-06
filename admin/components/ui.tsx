import Link from 'next/link'
import type { AdminDay, AdminUser } from '@/lib/db'
import { formatDate, formatNumber, formatPercent } from '@/lib/format'

// Small stroke icons on a 24px grid.
const ICONS = {
  home: 'M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1v-8z',
  users:
    'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20a6.5 6.5 0 0 1 13 0M16 4.3a3.5 3.5 0 0 1 0 6.4M18 14.2a6.5 6.5 0 0 1 3.5 5.8',
  file: 'M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM14 3v5h5M9 13h6M9 17h6',
  settings:
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3.9a7 7 0 0 0-2-1.2L14.2 3h-4l-.4 2.6a7 7 0 0 0-2 1.2l-2.3-.9-2 3.4 2 1.5a7 7 0 0 0 0 2.4l-2 1.5 2 3.4 2.3-.9a7 7 0 0 0 2 1.2l.4 2.6h4l.4-2.6a7 7 0 0 0 2-1.2l2.3.9 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z',
  logout: 'M15 4h3a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-3M10 16l-4-4 4-4M6 12h9',
  dollar: 'M12 3v18M16.5 7.5c-.6-1.5-2.3-2.5-4.5-2.5-2.6 0-4.5 1.4-4.5 3.4 0 4.6 9.5 2.2 9.5 6.8 0 2-2 3.8-5 3.8-2.5 0-4.4-1.2-5-3',
  spark: 'M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9L12 3zM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15z',
  activity: 'M3 12h4l3-8 4 16 3-8h4',
  card: 'M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7zM3 10h18M7 15h3',
} as const

export type IconName = keyof typeof ICONS

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={ICONS[name]} />
    </svg>
  )
}

export function PageHead({ title, count, children }: { title: string; count?: number | null; children?: React.ReactNode }) {
  return (
    <header className="page-head">
      <div>
        <h1>
          {title}
          {count !== undefined && <span className="count">{formatNumber(count)}</span>}
        </h1>
        {children}
      </div>
    </header>
  )
}

export function Stat({
  label,
  value,
  hint,
  icon,
  accent = false,
}: {
  label: string
  value: string
  hint?: string
  icon?: IconName
  accent?: boolean
}) {
  return (
    <div className={accent ? 'stat stat-accent' : 'stat'}>
      <div className="stat-top">
        <span className="stat-label">{label}</span>
        {icon && (
          <span className="stat-icon">
            <Icon name={icon} size={16} />
          </span>
        )}
      </div>
      <div className="stat-value">{value}</div>
      {hint && <div className="stat-hint">{hint}</div>}
    </div>
  )
}

export function PlanBadge({
  user,
}: {
  user: Pick<AdminUser, 'is_paid' | 'plan' | 'cancel_at_period_end' | 'billing_status'>
}) {
  if (!user.is_paid) {
    const failing = user.billing_status === 'past_due' || user.billing_status === 'unpaid'
    return failing ? <span className="badge badge-warn">Payment failing</span> : <span className="badge">Free</span>
  }
  const label = user.plan === 'unlimited' ? 'Unlimited' : user.plan === 'pro' ? 'Pro' : 'Starter'
  return (
    <span className={user.plan === 'starter' ? 'badge badge-starter' : 'badge badge-pro'}>
      {label}
      {user.cancel_at_period_end ? ' · cancelling' : ''}
    </span>
  )
}

// The Unlimited plan is stored as a quota no one can reach (see copalat_plan_limit).
const UNLIMITED_QUOTA = 1000000

// Proposals used out of the trial (free users) or this billing period (paid users).
export function Quota({ user }: { user: Pick<AdminUser, 'is_paid' | 'quota_used' | 'quota_limit'> }) {
  if (user.quota_limit >= UNLIMITED_QUOTA) {
    return (
      <span className="quota-text" title={`${user.quota_used} proposals written this billing period, no cap`}>
        {user.quota_used} · no cap
      </span>
    )
  }
  const limit = Math.max(user.quota_limit, 1)
  const used = Math.min(user.quota_used, limit)
  const full = used >= limit
  const title = user.is_paid
    ? `${used} of ${limit} proposals used this billing period`
    : `${used} of ${limit} free proposals used`
  return (
    <div className="quota" title={title}>
      <div className="quota-bar">
        <div className={full ? 'quota-fill quota-full' : 'quota-fill'} style={{ width: `${(used / limit) * 100}%` }} />
      </div>
      <span className={full ? 'quota-text quota-text-full' : 'quota-text'}>
        {used}/{limit}
      </span>
    </div>
  )
}

export function UserCell({
  id,
  email,
  name,
  avatar,
}: {
  id: string
  email: string | null
  name: string | null
  avatar: string | null
}) {
  return (
    <Link href={`/users/${id}`} className="user-cell">
      {avatar ? (
        <img src={avatar} alt="" className="avatar" referrerPolicy="no-referrer" />
      ) : (
        <span className="avatar avatar-empty">{(name || email || '?').charAt(0).toUpperCase()}</span>
      )}
      <span className="user-text">
        <span className="user-name">{name || email || 'Unknown user'}</span>
        {name && email && <span className="user-email">{email}</span>}
      </span>
    </Link>
  )
}

// Proposals (filled area) and sign-ups (line) per day, drawn as one SVG.
export function DailyChart({ days }: { days: AdminDay[] }) {
  const width = 800
  const height = 200
  const pad = { top: 12, bottom: 8 }
  const max = Math.max(1, ...days.map((d) => Math.max(d.signups, d.proposals)))
  const step = days.length > 1 ? width / (days.length - 1) : width
  const y = (value: number) => pad.top + (1 - value / max) * (height - pad.top - pad.bottom)
  const line = (key: 'signups' | 'proposals') =>
    days.map((d, i) => `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(1)} ${y(d[key]).toFixed(1)}`).join(' ')
  const total = (key: 'signups' | 'proposals') => days.reduce((sum, d) => sum + d[key], 0)

  return (
    <>
      <div className="chart">
        <span className="chart-max">{formatNumber(max)}</span>
        <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label="Proposals and sign-ups per day">
          <defs>
            <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--accent)" stopOpacity="0.28" />
              <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={f} x1="0" x2={width} y1={height * f} y2={height * f} className="chart-grid" />
          ))}
          <path d={`${line('proposals')} L${width} ${height} L0 ${height} Z`} fill="url(#chart-fill)" />
          <path d={line('proposals')} className="chart-line" />
          <path d={line('signups')} className="chart-line chart-line-alt" />
          {days.map((d, i) => (
            <rect key={d.day} x={i * step - step / 2} y="0" width={step} height={height} fill="transparent">
              <title>{`${formatDate(d.day)}: ${d.proposals} proposals, ${d.signups} sign-ups`}</title>
            </rect>
          ))}
        </svg>
      </div>
      <div className="chart-foot">
        <span>
          <span className="legend">
            <i /> Proposals <strong>{formatNumber(total('proposals'))}</strong>
          </span>
          <span className="legend">
            <i className="alt" /> Sign-ups <strong>{formatNumber(total('signups'))}</strong>
          </span>
        </span>
        <span>
          {formatDate(days[0]?.day)} – {formatDate(days[days.length - 1]?.day)}
        </span>
      </div>
    </>
  )
}

// How many users reach each stage, as bars relative to the first stage.
export function Funnel({ stages }: { stages: { label: string; value: number }[] }) {
  const top = Math.max(stages[0]?.value ?? 0, 1)
  return (
    <div className="funnel">
      {stages.map((stage) => (
        <div key={stage.label} className="funnel-row">
          <div className="funnel-label">
            <span>{stage.label}</span>
            <span>
              <strong>{formatNumber(stage.value)}</strong>
              <em>{formatPercent(stage.value, top)}</em>
            </span>
          </div>
          <div className="funnel-track">
            <div className="funnel-fill" style={{ width: `${Math.max((stage.value / top) * 100, stage.value ? 2 : 0)}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export function Pager({
  page,
  pageSize,
  total,
  href,
}: {
  page: number
  pageSize: number
  total: number
  href: (page: number) => string
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  if (pages <= 1) return null
  return (
    <div className="pager">
      {page > 0 ? <Link href={href(page - 1)}>← Previous</Link> : <span className="muted">← Previous</span>}
      <span className="muted">
        Page {page + 1} of {pages}
      </span>
      {page < pages - 1 ? <Link href={href(page + 1)}>Next →</Link> : <span className="muted">Next →</span>}
    </div>
  )
}
