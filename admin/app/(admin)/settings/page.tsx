import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { adminDb, unwrap } from '@/lib/db'
import { formatDateTime } from '@/lib/format'

// The selectors the extension understands (extenison/content/proposals.js).
const KEYS = ['title', 'description', 'moreDescription', 'allTags', 'skillBadge', 'coverLetter'] as const

async function save(formData: FormData) {
  'use server'
  const db = await adminDb()
  const value: Record<string, string> = {}
  for (const key of KEYS) value[key] = String(formData.get(key) || '').trim().slice(0, 300)

  const { error } = await db
    .from('copalat_config')
    .upsert({ key: 'selectors', value, updated_at: new Date().toISOString() })
  if (error) throw new Error(error.message)
  revalidatePath('/settings')
  redirect('/settings?saved=1')
}

const HELP: Record<(typeof KEYS)[number], string> = {
  title: 'Job title on the proposal page. Optional.',
  description: 'The job description text. Required for proposals to work.',
  moreDescription: 'Button that expands a truncated description. Clicked before reading it.',
  allTags: 'Each skill tag on the job.',
  skillBadge: 'The specialization badge.',
  coverLetter: 'Cover letter box. Leave empty to find it by its label.',
}

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const { saved } = await searchParams
  const db = await adminDb()
  const row = await db
    .from('copalat_config')
    .select('value, updated_at')
    .eq('key', 'selectors')
    .maybeSingle()
    .then(unwrap<{ value: Record<string, string>; updated_at: string } | null>)

  return (
    <>
      <h1>Settings</h1>
      <section className="card">
        <div className="card-head">
          <h2>Upwork page selectors</h2>
          <span className="muted">Last saved {formatDateTime(row?.updated_at)}</span>
        </div>
        <form action={save} className="form">
          <p className="muted">
            CSS selectors the extension uses to read the job on Upwork&apos;s proposal page. When Upwork changes its
            page and proposals stop reading the job, fix the selector here. Every user picks it up the next time they
            open a proposal page, with no new extension version.
          </p>
          {KEYS.map((key) => (
            <label key={key}>
              <strong>{key}</strong> <span className="muted">— {HELP[key]}</span>
              <input name={key} defaultValue={row?.value?.[key] ?? ''} style={{ width: '100%', marginTop: 4 }} />
            </label>
          ))}
          {saved && <p className="notice">Saved.</p>}
          <button type="submit">Save selectors</button>
        </form>
      </section>
    </>
  )
}
