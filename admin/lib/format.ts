const number = new Intl.NumberFormat('en-US')
const date = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' })
const dateTime = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' })

export const formatNumber = (value: number | null | undefined) => number.format(value ?? 0)

export const formatDate = (value: string | null | undefined) => (value ? date.format(new Date(value)) : '—')

export const formatDateTime = (value: string | null | undefined) => (value ? dateTime.format(new Date(value)) : '—')

export const formatPercent = (part: number, whole: number) => (whole ? `${((part / whole) * 100).toFixed(1)}%` : '0%')

export function timeAgo(value: string | null | undefined) {
  if (!value) return 'never'
  const seconds = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 1000))
  if (seconds < 60) return 'just now'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days}d ago`
  return formatDate(value)
}
