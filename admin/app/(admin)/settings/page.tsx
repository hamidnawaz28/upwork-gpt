import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { PageHead } from '@/components/ui'
import { adminDb, unwrap } from '@/lib/db'
import { formatDateTime, timeAgo } from '@/lib/format'

// Fallbacks for when the Edge Function cannot be reached. The real defaults live in
// supabase/functions/copalat/generate.ts and are fetched from there.
const FALLBACK_MODEL = 'gpt-4o-mini'
const FALLBACK_MAX_PROMPT = 12000

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

type Remote = {
  defaultModel: string
  defaultPrompt: string
  maxPrompt: number
  models: string[]
  modelsError?: string
  error?: string
}

// Asks the Edge Function for its built-in defaults and for the models the OpenAI account
// can use. The OpenAI key lives only in the function's secrets, so this has to come from there.
async function remoteConfig(): Promise<Remote> {
  const empty = { defaultModel: FALLBACK_MODEL, defaultPrompt: '', maxPrompt: FALLBACK_MAX_PROMPT, models: [] }
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  try {
    const res = await fetch(`${url}/functions/v1/copalat/models`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, apikey: key ?? '' },
      cache: 'no-store',
    })
    const data = await res.json()
    return res.ok ? { ...empty, ...data } : { ...empty, error: data.error || `Edge Function answered ${res.status}` }
  } catch {
    return { ...empty, error: 'Could not reach the Edge Function' }
  }
}

async function saveValue(key: string, value: unknown) {
  const db = await adminDb()
  unwrap(await db.from('copalat_config').upsert({ key, value, updated_at: new Date().toISOString() }).select())
}

async function clearValue(key: string) {
  const db = await adminDb()
  unwrap(await db.from('copalat_config').delete().eq('key', key).select())
}

async function saveModel(formData: FormData) {
  'use server'
  const model = String(formData.get('model') || '').trim()
  // An empty choice goes back to the default model.
  if (!model) await clearValue('openai_model')
  else if (!/^[\w.:-]{1,64}$/.test(model)) redirect('/settings?error=model')
  else await saveValue('openai_model', model)
  revalidatePath('/settings')
  redirect('/settings?saved=model')
}

async function savePrompt(formData: FormData) {
  'use server'
  const prompt = String(formData.get('prompt') || '').trim()
  if (formData.get('intent') === 'reset') {
    await clearValue('system_prompt')
    revalidatePath('/settings')
    redirect('/settings?saved=prompt-reset#prompt')
  }
  // The function ignores anything this short and uses its default, so refuse it here.
  if (prompt.length < 50) redirect('/settings?error=prompt#prompt')
  await saveValue('system_prompt', prompt.slice(0, FALLBACK_MAX_PROMPT))
  revalidatePath('/settings')
  redirect('/settings?saved=prompt#prompt')
}

async function saveSelectors(formData: FormData) {
  'use server'
  const value: Record<string, string> = {}
  for (const key of KEYS) value[key] = String(formData.get(key) || '').trim().slice(0, 300)
  await saveValue('selectors', value)
  revalidatePath('/settings')
  redirect('/settings?saved=selectors#selectors')
}

type ConfigRow = { key: string; value: unknown; updated_at: string }

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>
}) {
  const { saved, error } = await searchParams
  const db = await adminDb()
  const [rows, remote] = await Promise.all([
    db
      .from('copalat_config')
      .select('key, value, updated_at')
      .in('key', ['selectors', 'openai_model', 'system_prompt', 'last_ai_error'])
      .then(unwrap<ConfigRow[]>),
    remoteConfig(),
  ])
  const row = (key: string) => rows.find((r) => r.key === key)
  const text = (key: string) => (typeof row(key)?.value === 'string' ? (row(key)!.value as string) : '')

  const selectors = (row('selectors')?.value ?? {}) as Record<string, string>
  const model = text('openai_model')
  const prompt = text('system_prompt')
  // The saved model stays selectable even if OpenAI no longer lists it.
  const options = remote.models.length ? [...new Set([...remote.models, ...(model ? [model] : [])])].sort() : []
  const modelsProblem = remote.error || remote.modelsError || 'no models returned'
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
            {model ? `Last saved ${formatDateTime(row('openai_model')?.updated_at)}` : 'Using the default'}
          </span>
        </div>
        <form action={saveModel} className="form">
          <p className="muted">
            The OpenAI model that writes proposals. The default is <strong>{remote.defaultModel}</strong>. Stronger
            models write better and cost more per proposal.
          </p>
          {options.length ? (
            <label>
              <strong>Model</strong>
              <select name="model" defaultValue={model}>
                <option value="">Default ({remote.defaultModel})</option>
                {options.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
              <span className="muted">{remote.models.length} models available on your OpenAI account, listed live.</span>
            </label>
          ) : (
            <label>
              <strong>Model name</strong>
              <input
                name="model"
                defaultValue={model}
                placeholder={remote.defaultModel}
                autoComplete="off"
                spellCheck={false}
              />
              <span className="muted">The list of models could not be loaded ({modelsProblem}), so type the name.</span>
            </label>
          )}
          {saved === 'model' && (
            <p className="notice">Saved. The next proposal will use {model || remote.defaultModel}.</p>
          )}
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

      <section className="card" id="prompt">
        <div className="card-head">
          <h2>Proposal prompt</h2>
          <span className="muted">
            {prompt ? `Custom, last saved ${formatDateTime(row('system_prompt')?.updated_at)}` : 'Using the built-in prompt'}
          </span>
        </div>
        <form action={savePrompt} className="form">
          <p className="muted">
            The instructions the AI follows when it writes a cover letter and screening answers. Edit them and save;
            the next proposal uses the new text. The job post, the freelancer&apos;s profile, the tone and the word
            target are added automatically for each request, and so is the output format, so you only describe how to
            write.
          </p>
          <label>
            <strong>Instructions</strong>
            <textarea
              name="prompt"
              rows={26}
              maxLength={remote.maxPrompt}
              defaultValue={prompt || remote.defaultPrompt}
              spellCheck={false}
            />
            <span className="muted">Up to {remote.maxPrompt.toLocaleString('en-US')} characters.</span>
          </label>
          {!prompt && !remote.defaultPrompt && (
            <p className="muted">
              The built-in prompt could not be loaded ({remote.error || 'unknown reason'}). Saving an empty box changes
              nothing.
            </p>
          )}
          {saved === 'prompt' && <p className="notice">Saved. The next proposal will use this prompt.</p>}
          {saved === 'prompt-reset' && <p className="notice">Back to the built-in prompt.</p>}
          {error === 'prompt' && (
            <p className="error" role="alert">
              That prompt is too short to be useful, so it was not saved.
            </p>
          )}
          <div className="form-actions">
            <button type="submit" name="intent" value="save">
              Save prompt
            </button>
            {prompt && (
              <button type="submit" name="intent" value="reset" className="button-ghost" formNoValidate>
                Reset to built-in
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="card" id="selectors">
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
