import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { PageHead } from '@/components/ui'
import { adminDb, unwrap } from '@/lib/db'
import { formatDateTime, timeAgo } from '@/lib/format'

// Used when no model is saved (must match DEFAULT_MODEL in supabase/functions/copalat/generate.ts).
const DEFAULT_MODEL = 'gpt-4o-mini'

// Asks the Edge Function which models the OpenAI account can use. The OpenAI key lives
// only in the function's secrets, so the list has to come from there.
async function availableModels(): Promise<{ models: string[]; error?: string }> {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  try {
    const res = await fetch(`${url}/functions/v1/copalat/models`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, apikey: key ?? '' },
      cache: 'no-store',
    })
    const data = await res.json()
    return res.ok ? { models: data.models ?? [] } : { models: [], error: data.error }
  } catch {
    return { models: [], error: 'Could not reach the Edge Function' }
  }
}

// The selectors the extension understands (extenison/content/proposals.js).
const KEYS = ['title', 'description', 'moreDescription', 'allTags', 'skillBadge', 'coverLetter'] as const

const HELP: Record<(typeof KEYS)[number], string> = {
  title: 'Job title on the proposal page. Optional.',
  description: 'The job description text. Required for proposals to work.',
  moreDescription: 'Button that expands a truncated description. Clicked before reading it.',
  allTags: 'Each skill tag on the job.',
  skillBadge: 'The specialization badge.',
  coverLetter: 'Cover letter box. Leave empty to find it by its label.',
}

async function saveModel(formData: FormData) {
  'use server'
  const db = await adminDb()
  const model = String(formData.get('model') || '').trim()
  // An empty field goes back to the default model.
  if (!model) {
    unwrap(await db.from('copalat_config').delete().eq('key', 'openai_model').select())
  } else {
    if (!/^[\w.:-]{1,64}$/.test(model)) redirect('/settings?error=model')
    const row = { key: 'openai_model', value: model, updated_at: new Date().toISOString() }
    unwrap(await db.from('copalat_config').upsert(row).select())
  }
  revalidatePath('/settings')
  redirect('/settings?saved=model')
}

async function saveSelectors(formData: FormData) {
  'use server'
  const db = await adminDb()
  const value: Record<string, string> = {}
  for (const key of KEYS) value[key] = String(formData.get(key) || '').trim().slice(0, 300)

  const row = { key: 'selectors', value, updated_at: new Date().toISOString() }
  unwrap(await db.from('copalat_config').upsert(row).select())
  revalidatePath('/settings')
  redirect('/settings?saved=selectors')
}

type ConfigRow = { key: string; value: unknown; updated_at: string }

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>
}) {
  const { saved, error } = await searchParams
  const db = await adminDb()
  const [rows, available] = await Promise.all([
    db
      .from('copalat_config')
      .select('key, value, updated_at')
      .in('key', ['selectors', 'openai_model', 'last_ai_error'])
      .then(unwrap<ConfigRow[]>),
    availableModels(),
  ])
  const row = (key: string) => rows.find((r) => r.key === key)

  const selectors = (row('selectors')?.value ?? {}) as Record<string, string>
  const model = typeof row('openai_model')?.value === 'string' ? (row('openai_model')!.value as string) : ''
  // The saved model stays selectable even if OpenAI no longer lists it.
  const options = available.models.length
    ? [...new Set([...available.models, ...(model ? [model] : [])])].sort()
    : []
  const lastError = row('last_ai_error') as (ConfigRow & { value: { message?: string; model?: string } }) | undefined

  return (
    <>
      <PageHead title="Settings">
        <p className="muted">Changes apply to every user straight away. No new extension version is needed.</p>
      </PageHead>

      <section className="card">
        <div className="card-head">
          <h2>AI model</h2>
          <span className="muted">
            {model ? `Last saved ${formatDateTime(row('openai_model')?.updated_at)}` : `Using the default`}
          </span>
        </div>
        <form action={saveModel} className="form">
          <p className="muted">
            The OpenAI model that writes proposals. The default is <strong>{DEFAULT_MODEL}</strong>. Stronger models
            write better and cost more per proposal.
          </p>
          {options.length ? (
            <label>
              <strong>Model</strong>
              <select name="model" defaultValue={model}>
                <option value="">Default ({DEFAULT_MODEL})</option>
                {options.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
              <span className="muted">
                {available.models.length} models available on your OpenAI account, listed live.
              </span>
            </label>
          ) : (
            <label>
              <strong>Model name</strong>
              <input
                name="model"
                defaultValue={model}
                placeholder={DEFAULT_MODEL}
                autoComplete="off"
                spellCheck={false}
              />
              <span className="muted">
                The list of models could not be loaded ({available.error || 'no models returned'}), so type the name.
              </span>
            </label>
          )}
          {saved === 'model' && <p className="notice">Saved. The next proposal will use {model || DEFAULT_MODEL}.</p>}
          {error === 'model' && (
            <p className="error" role="alert">
              That does not look like a model name. Use letters, numbers, dots and dashes only.
            </p>
          )}
          {lastError?.value?.message && (
            <p className="muted">
              Last failed proposal ({timeAgo(lastError.updated_at)}, model {lastError.value.model || 'unknown'}):{' '}
              <span className="error">{lastError.value.message}</span>
            </p>
          )}
          <button type="submit">Save model</button>
        </form>
      </section>

      <section className="card">
        <div className="card-head">
          <h2>Upwork page selectors</h2>
          <span className="muted">Last saved {formatDateTime(row('selectors')?.updated_at)}</span>
        </div>
        <form action={saveSelectors} className="form">
          <p className="muted">
            CSS selectors the extension uses to read the job on Upwork&apos;s proposal page. When Upwork changes its
            page and proposals stop reading the job, fix the selector here.
          </p>
          {KEYS.map((key) => (
            <label key={key}>
              <span>
                <strong>{key}</strong> <span className="muted">— {HELP[key]}</span>
              </span>
              <input name={key} defaultValue={selectors[key] ?? ''} autoComplete="off" spellCheck={false} />
            </label>
          ))}
          {saved === 'selectors' && <p className="notice">Saved.</p>}
          <button type="submit">Save selectors</button>
        </form>
      </section>
    </>
  )
}
