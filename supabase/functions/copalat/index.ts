// Copalat backend. One function, routed by the last path segment:
//   POST /copalat/account        account, usage, settings and page selectors
//   POST /copalat/settings       save the freelancer profile and defaults
//   POST /copalat/generate       write a proposal (counts against the trial / plan)
//   POST /copalat/history        recent proposals
//   POST /copalat/checkout       Stripe Checkout for a plan
//   POST /copalat/portal         Stripe customer portal
//   POST /copalat/webhook        Stripe webhook
//   GET  /copalat/checkout-done  page shown after checkout
//
// Deployed with verify_jwt off: the user routes check the Supabase session themselves and
// the Stripe routes are called without one.
//
// Secrets: OPENAI_API_KEY, STRIPE_SECRET_KEY (or COPALAT_STRIPE_SECRET_KEY),
// optional COPALAT_STRIPE_WEBHOOK_SECRET and COPALAT_OPENAI_MODEL.
import { checkoutDone, createCheckout, createPortal, handleWebhook, stripeConfigured, syncUser } from './billing.ts'
import { generate, LENGTHS, TONES } from './generate.ts'
import { admin, AppUser, getAccount, HttpError, json, requireUser } from './lib.ts'

async function account(user: AppUser) {
  let info = await getAccount(user)
  if (info.needs_sync && stripeConfigured()) {
    await syncUser(user.id).catch((err) => console.error('subscription sync failed', err))
    info = await getAccount(user)
  }
  const { data } = await admin.from('copalat_config').select('value').eq('key', 'selectors').maybeSingle()
  return { account: info, selectors: data?.value ?? {} }
}

async function saveSettings(user: AppUser, body: Record<string, unknown>) {
  const update: Record<string, string> = {}
  if (typeof body.about === 'string') update.about = body.about.trim().slice(0, 3000)
  if (typeof body.tone === 'string' && TONES[body.tone]) update.tone = body.tone
  if (typeof body.length === 'string' && LENGTHS[body.length]) update.length = body.length

  await getAccount(user)
  if (Object.keys(update).length) {
    const { error } = await admin.from('copalat_accounts').update(update).eq('user_id', user.id)
    if (error) throw new Error(`saving settings failed: ${error.message}`)
  }
  return { account: await getAccount(user) }
}

async function history(user: AppUser) {
  const { data, error } = await admin
    .from('copalat_proposals')
    .select('id, job_url, job_title, content, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)
  if (error) throw new Error(`loading history failed: ${error.message}`)
  return { proposals: data }
}

Deno.serve(async (req) => {
  const route = new URL(req.url).pathname.split('/').filter(Boolean).pop()
  try {
    if (route === 'checkout-done') return await checkoutDone(req)
    if (req.method !== 'POST') throw new HttpError(405, 'Method not allowed')
    if (route === 'webhook') return await handleWebhook(req)

    const user = await requireUser(req)
    const body = await req.json().catch(() => ({}))
    switch (route) {
      case 'account':
        return json(await account(user))
      case 'settings':
        return json(await saveSettings(user, body))
      case 'generate':
        return json(await generate(user, body))
      case 'history':
        return json(await history(user))
      case 'checkout':
        return json(await createCheckout(user, body.plan))
      case 'portal':
        return json(await createPortal(user))
      default:
        throw new HttpError(404, 'Not found')
    }
  } catch (err) {
    if (err instanceof HttpError) return json({ error: err.message, ...err.extra }, err.status)
    console.error(err)
    return json({ error: 'Something went wrong. Please try again.' }, 500)
  }
})
