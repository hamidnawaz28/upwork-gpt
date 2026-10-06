// Writes the proposal. One generation is reserved before the AI call and given back if the
// call fails, so users are only ever charged for proposals they actually received.
import { stripeConfigured, syncUser } from './billing.ts'
import { admin, AppUser, HttpError, rpc } from './lib.ts'

export const TONES: Record<string, string> = {
  professional: 'professional and polished, but warm',
  friendly: 'friendly and conversational, like a helpful colleague',
  confident: 'confident and direct, leading with results',
  concise: 'brief and to the point, no filler at all',
}

export const LENGTHS: Record<string, number> = { short: 120, medium: 200, detailed: 300 }

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

const SYSTEM_PROMPT = `You write Upwork proposals (cover letters) for a freelancer. Clients skim dozens of proposals and only see the first two lines in their list, so those lines decide whether the proposal gets opened.

Rules:
- Open with a line about the client's specific problem or goal. No greetings like "Dear Hiring Manager", no "I hope this finds you well", no restating that you read the job post.
- Show you understood the job by naming the concrete thing they need, then say briefly how you would approach it.
- Use relevant experience ONLY from the freelancer profile you are given. Never invent client names, numbers, years of experience, links or results. If no profile is given, stay general and honest instead of making claims.
- Never output placeholders such as [Your Name] or [link]. Do not add a signature.
- End with one short, specific question about the project or a clear next step.
- Plain text only: no markdown, no headings, no bullet symbols. Short paragraphs separated by a blank line.
- Write in the same language as the job description.

Reply with a JSON object: {"cover_letter": string, "answers": [{"question": string, "answer": string}]}.
"answers" has one entry for each screening question you are given, in the same order, each answered in 2-4 sentences in the freelancer's voice. Use an empty array when there are no questions.`

function buildPrompt(input: Required<GenerateInput>, about: string, tone: string, length: string) {
  const { job, options } = input
  const parts = [
    `Tone: ${TONES[tone]}.`,
    `Cover letter length: about ${LENGTHS[length]} words.`,
    about ? `Freelancer profile:\n${about}` : 'Freelancer profile: not provided.',
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

async function askOpenAi(apiKey: string, prompt: string) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: Deno.env.get('COPALAT_OPENAI_MODEL') ?? 'gpt-4o-mini',
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
