// Writes the proposal. One generation is reserved before the AI call and given back if the
// call fails, so users are only ever charged for proposals they actually received.
import { stripeConfigured, syncUser } from './billing.ts'
import { admin, AppUser, HttpError, rpc } from './lib.ts'

export const TONES: Record<string, string> = {
  professional: 'calm, precise and businesslike, the way a senior consultant writes to a new client',
  friendly: 'warm and relaxed, like a helpful colleague, with no slang and no exclamation marks',
  confident: 'direct and assured: lead with what you would do and why it works, no hedging words',
  concise: 'as few words as possible: short sentences, no warm-up, every sentence carries new information',
}

// Word targets. Short proposals get read; these are deliberately tight.
export const LENGTHS: Record<string, number> = { short: 90, medium: 150, detailed: 230 }

const MAX_DESCRIPTION = 8000
const MAX_QUESTIONS = 6

const clip = (value: unknown, max: number) => (typeof value === 'string' ? value.trim().slice(0, max) : '')

interface GenerateInput {
  job?: {
    title?: string
    description?: string
    skills?: string[]
    skillBadge?: string
    url?: string
    questions?: string[]
  }
  options?: { tone?: string; length?: string; instructions?: string }
}

// The prompt makes the model work out what the client cares about ("analysis") before it
// writes, because proposals written straight from the job text come out as a restatement
// of the post. The analysis is discarded; only cover_letter and answers are used.
const SYSTEM_PROMPT = `You are a top-rated Upwork freelancer writing your own proposal for a job. The only goal is to get this client to reply.

HOW CLIENTS READ
A client sees the first two lines of 20 to 50 proposals in a list and opens a handful. Anything that sounds templated or AI-written is skipped. When they open one they look for four things, in this order: did this person actually read my post, have they solved this before, what exactly would they do, and how easy is it to say yes.

STEP 1: ANALYSIS (the client never sees this)
- goal: the outcome the client is really after, as a result for their business, not the task list.
- worry: the risk or frustration behind the post, inferred from their wording (a previous freelancer who failed, a deadline, fear of bugs or rework).
- detail: one specific detail from the post that a template could never contain.
- instructions: everything the post tells applicants to do (begin with a certain word, answer a question, state availability or rate, share examples). Empty list if none.
- proof: the single most relevant fact in the freelancer profile for THIS job. Empty string if the profile has nothing relevant.
- insight: one sharp, non-obvious point about doing this job well: a likely pitfall, a decision that should be made first, or a quicker way. It must be specific to this job.

STEP 2: COVER LETTER, in this order
1. Instructions first. If the post asked applicants to do something, do it exactly, at the very top (a required word is the first word).
2. Hook, one or two sentences, at most 35 words. It must work on its own as the preview. Speak to the goal or the worry and use the detail. Do not open with "I", with a greeting, or by describing the client back to themselves ("You want", "You need", "You're looking for", "I see you need").
3. Proof, one or two sentences, built on the proof fact, with its number or result if the profile gives one. If proof is empty, skip this part completely. Never fill the gap with claims.
4. Plan: the two or three concrete things you would do first on THIS job, in the order you would do them, including the insight. You may write them as short lines starting with "1.", "2.", "3.".
5. Close with exactly one easy question that moves the project forward and can be answered in a line, or one specific next step. The whole letter contains at most one question.

RULES
- Stay within 15 percent of the word target. Shorter is better than padded.
- Paragraphs of one to three sentences, separated by a blank line.
- Plain words and contractions. Write like an expert messaging a peer, not like a brochure.
- Do not repeat the client's list of technologies or requirements back to them. Name a technology only when you are saying something about it.
- Use only facts from the freelancer profile. Never invent clients, numbers, years of experience, results or links. With no usable profile, be specific about the work instead of about yourself.
- No placeholders such as [Your Name]. No sign-off, no name, no "Best regards".
- Never use these: "I hope", "Dear", "Hiring Manager", "I am excited", "I'm confident", "I'm comfortable", "I understand that", "I can step into", "end to end", "end-to-end", "leverage", "seamless", "robust", "passionate", "delve", "ensure", "perfect fit", "look no further", "hit the ground running", "years of experience" (unless the profile states the number). No em dashes.
- Plain text only: no markdown, no headings, no bold, no emoji.
- Write in the same language as the job description.

SCREENING ANSWERS
One answer per question, in the same order, two to four sentences each. Answer directly in the first sentence, be specific, and follow the same honesty rules.

Reply with a JSON object, with the keys in exactly this order:
{"analysis": {"goal": string, "worry": string, "detail": string, "instructions": string[], "proof": string, "insight": string}, "cover_letter": string, "answers": [{"question": string, "answer": string}]}
Use an empty "answers" list when there are no screening questions.`

function buildPrompt(input: Required<GenerateInput>, about: string, tone: string, length: string) {
  const { job, options } = input
  const parts = [
    `Tone: ${TONES[tone]}.`,
    `Word target for the cover letter: ${LENGTHS[length]} words.`,
    about
      ? `Freelancer profile:\n${about}`
      : 'Freelancer profile: none provided. Make no claims about the freelancer; win on the hook, the plan and the insight.',
    job.title ? `Job title: ${job.title}` : '',
    job.skillBadge ? `Specialization: ${job.skillBadge}` : '',
    job.skills?.length ? `Skills the client asked for: ${job.skills.join(', ')}` : '',
    `Job description:\n${job.description}`,
    job.questions?.length
      ? `Screening questions:\n${job.questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`
      : '',
    options.instructions ? `Extra instructions from the freelancer: ${options.instructions}` : '',
  ]
  return parts.filter(Boolean).join('\n\n')
}

const DEFAULT_MODEL = 'gpt-4o-mini'

// The model is chosen in the admin dashboard (copalat_config.openai_model). The
// COPALAT_OPENAI_MODEL secret and then the default apply when nothing is saved there.
async function currentModel() {
  const { data } = await admin.from('copalat_config').select('value').eq('key', 'openai_model').maybeSingle()
  const saved = typeof data?.value === 'string' ? data.value.trim() : ''
  return /^[\w.:-]{1,64}$/.test(saved) ? saved : Deno.env.get('COPALAT_OPENAI_MODEL') ?? DEFAULT_MODEL
}

// Text models this OpenAI account can use, for the model picker in the admin dashboard.
export async function listModels() {
  const apiKey = Deno.env.get('OPENAI_API_KEY')
  if (!apiKey) throw new HttpError(503, 'OPENAI_API_KEY is not set in the Edge Function secrets')
  const res = await fetch('https://api.openai.com/v1/models', { headers: { Authorization: `Bearer ${apiKey}` } })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new HttpError(502, `OpenAI: ${data?.error?.message ?? 'could not list models'}`)

  const models = (data.data as { id: string }[])
    .map((model) => model.id)
    .filter((id) => /^(gpt-|o\d|chatgpt-)/.test(id))
    .filter((id) => !/audio|realtime|tts|transcribe|image|embedding|search|instruct|moderation|codex/.test(id))
    .sort()
  return { models, current: await currentModel(), defaultModel: DEFAULT_MODEL }
}

async function askOpenAi(apiKey: string, prompt: string) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: await currentModel(),
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
    }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${data?.error?.message ?? 'request failed'}`)

  const parsed = JSON.parse(data?.choices?.[0]?.message?.content ?? '{}')
  const coverLetter = clip(parsed.cover_letter, 10000)
  if (!coverLetter) throw new Error('OpenAI returned no cover letter')
  const answers = (Array.isArray(parsed.answers) ? parsed.answers : [])
    .map((a: any) => ({ question: clip(a?.question, 500), answer: clip(a?.answer, 3000) }))
    .filter((a: { answer: string }) => a.answer)
  return { coverLetter, answers }
}

const LIMIT_MESSAGES: Record<string, string> = {
  trial_ended: 'You have used your 5 free proposals. Pick a plan to keep going.',
  plan_limit: 'You have used all the proposals in your plan for this billing period.',
  needs_sync: 'We could not confirm your subscription. Please try again in a minute.',
}

async function reserve(user: AppUser) {
  const args = { p_user: user.id, p_email: user.email }
  let result = await rpc('copalat_reserve_generation', args)
  // The paid period ran out: find out from Stripe whether it renewed, then try once more.
  if (result.reason === 'needs_sync' && stripeConfigured()) {
    await syncUser(user.id).catch((err) => console.error('subscription sync failed', err))
    result = await rpc('copalat_reserve_generation', args)
  }
  if (!result.allowed) {
    throw new HttpError(402, LIMIT_MESSAGES[result.reason] ?? 'No proposals left', {
      code: 'limit',
      reason: result.reason,
      account: result.account,
    })
  }
  return result as { bucket: string; account: Record<string, any> }
}

export async function generate(user: AppUser, body: GenerateInput) {
  const apiKey = Deno.env.get('OPENAI_API_KEY')
  if (!apiKey) throw new HttpError(503, 'Proposal generation is not set up yet')

  const job = {
    title: clip(body.job?.title, 300),
    description: clip(body.job?.description, MAX_DESCRIPTION),
    skills: (Array.isArray(body.job?.skills) ? body.job!.skills! : []).map((s) => clip(s, 60)).filter(Boolean).slice(0, 30),
    skillBadge: clip(body.job?.skillBadge, 120),
    url: clip(body.job?.url, 500),
    questions: (Array.isArray(body.job?.questions) ? body.job!.questions! : [])
      .map((q) => clip(q, 500))
      .filter(Boolean)
      .slice(0, MAX_QUESTIONS),
  }
  if (job.description.length < 30) {
    throw new HttpError(400, 'Could not read the job description on this page. Expand the job details and try again.')
  }

  const reserved = await reserve(user)
  const settings = reserved.account.settings
  const tone = TONES[body.options?.tone ?? ''] ? body.options!.tone! : settings.tone
  const length = LENGTHS[body.options?.length ?? ''] ? body.options!.length! : settings.length
  const options = { tone, length, instructions: clip(body.options?.instructions, 500) }

  let result: Awaited<ReturnType<typeof askOpenAi>>
  try {
    result = await askOpenAi(apiKey, buildPrompt({ job, options }, settings.about, tone, length))
  } catch (err) {
    console.error(err)
    // Kept for the admin's Settings page, so a wrong model name or an OpenAI billing
    // problem can be seen without reading the function logs.
    await admin.from('copalat_config').upsert({
      key: 'last_ai_error',
      value: { message: String((err as Error)?.message ?? err).slice(0, 500), model: await currentModel() },
      updated_at: new Date().toISOString(),
    })
    await rpc('copalat_refund_generation', { p_user: user.id, p_bucket: reserved.bucket })
    throw new HttpError(502, 'The AI could not write this proposal. Nothing was deducted, please try again.')
  }

  const { error } = await admin.from('copalat_proposals').insert({
    user_id: user.id,
    job_url: job.url,
    job_title: job.title,
    tone,
    length,
    content: result.coverLetter,
    answers: result.answers,
  })
  if (error) console.error('saving proposal failed', error.message)

  return { ...result, account: reserved.account }
}
