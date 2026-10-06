// Stripe: checkout, customer portal, and keeping copalat_accounts in step with subscriptions.
//
// The Stripe account may be shared with other products, so everything Copalat creates is
// tagged metadata.app = 'copalat' and everything else is ignored. Copalat deliberately does
// not set client_reference_id or a `user_id` metadata key: other webhooks on the account
// use those to find their own users.
import Stripe from 'npm:stripe@17'
import { admin, AppUser, FUNCTION_URL, getAccount, HttpError, rpc, text, json } from './lib.ts'

const APP = 'copalat'

// Monthly plans. The proposal quotas themselves are enforced in SQL (copalat_plan_limit).
const PLANS: Record<string, { name: string; amount: number; lookupKey: string }> = {
  starter: {
    name: 'Copalat Starter (30 proposals / month)',
    amount: 900,
    lookupKey: 'copalat_starter_monthly',
  },
  pro: {
    name: 'Copalat Pro (60 proposals / month)',
    amount: 1500,
    lookupKey: 'copalat_pro_monthly',
  },
  unlimited: {
    name: 'Copalat Unlimited (unlimited proposals / month)',
    amount: 9900,
    lookupKey: 'copalat_unlimited_monthly',
  },
}

const cryptoProvider = Stripe.createSubtleCryptoProvider()

const secretKey = () => Deno.env.get('COPALAT_STRIPE_SECRET_KEY') ?? Deno.env.get('STRIPE_SECRET_KEY')

export const stripeConfigured = () => Boolean(secretKey())

function getStripe() {
  const key = secretKey()
  if (!key) throw new HttpError(503, 'Payments are not set up yet')
  return new Stripe(key, { httpClient: Stripe.createFetchHttpClient() })
}

const idOf = (value: string | { id: string } | null | undefined) =>
  typeof value === 'string' ? value : value?.id ?? null

const toIso = (seconds?: number | null) => (seconds ? new Date(seconds * 1000).toISOString() : null)

// Finds the plan's price by lookup key and creates the product + price the first time it is
// needed, so there is nothing to set up by hand in the Stripe dashboard.
async function priceFor(stripe: Stripe, plan: string) {
  const config = PLANS[plan]
  const find = async () =>
    (await stripe.prices.list({ lookup_keys: [config.lookupKey], active: true, limit: 1 })).data[0]

  const existing = await find()
  if (existing) return existing.id
  try {
    const price = await stripe.prices.create({
      currency: 'usd',
      unit_amount: config.amount,
      recurring: { interval: 'month' },
      lookup_key: config.lookupKey,
      metadata: { app: APP, copalat_plan: plan },
      product_data: { name: config.name, metadata: { app: APP } },
    })
    return price.id
  } catch (err) {
    // Two first checkouts at once: the other request created it.
    const created = await find()
    if (created) return created.id
    throw err
  }
}

const planOfPrice = (price?: Stripe.Price | null) =>
  price?.metadata?.copalat_plan ??
  Object.keys(PLANS).find((plan) => PLANS[plan].lookupKey === price?.lookup_key) ??
  null

async function userIdForCustomer(customerId: string | null) {
  if (!customerId) return null
  const { data } = await admin
    .from('copalat_accounts')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle()
  return data?.user_id ?? null
}

// Reads the subscription from Stripe (never trusting a webhook payload's contents) and
// records it. Returns false for subscriptions that belong to another product.
async function syncSubscription(stripe: Stripe, subscriptionId: string) {
  const sub = await stripe.subscriptions.retrieve(subscriptionId)
  if (sub.metadata?.app !== APP) return false

  const customerId = idOf(sub.customer)
  const userId = sub.metadata?.copalat_user_id ?? (await userIdForCustomer(customerId))
  if (!userId) return false

  // Newer Stripe API versions moved the billing period onto the subscription items.
  type Period = { current_period_start?: number; current_period_end?: number }
  const item = sub.items?.data?.[0]
  const period: Period = (sub as Period).current_period_end ? (sub as Period) : ((item ?? {}) as Period)

  await rpc('copalat_apply_subscription', {
    p_user: userId,
    p_customer: customerId,
    p_subscription: sub.id,
    p_plan: planOfPrice(item?.price) ?? sub.metadata?.copalat_plan ?? null,
    p_status: sub.status,
    p_period_start: toIso(period.current_period_start),
    p_period_end: toIso(period.current_period_end),
    p_cancel_at_period_end: sub.cancel_at_period_end,
  })
  return true
}

// Asks Stripe for the user's current subscription. Used when a billing period has run out
// and no webhook has said yet whether it renewed.
export async function syncUser(userId: string) {
  const { data } = await admin
    .from('copalat_accounts')
    .select('stripe_subscription_id')
    .eq('user_id', userId)
    .maybeSingle()
  if (!data?.stripe_subscription_id) return
  await syncSubscription(getStripe(), data.stripe_subscription_id)
}

async function customerFor(stripe: Stripe, user: AppUser) {
  const { data } = await admin
    .from('copalat_accounts')
    .select('stripe_customer_id, stripe_subscription_id, status')
    .eq('user_id', user.id)
    .maybeSingle()
  if (data?.stripe_customer_id) {
    return { customerId: data.stripe_customer_id, subscriptionId: data.stripe_subscription_id, status: data.status }
  }

  const customer = await stripe.customers.create({
    email: user.email ?? undefined,
    name: user.name ?? undefined,
    metadata: { app: APP, copalat_user_id: user.id },
  })
  const { error } = await admin
    .from('copalat_accounts')
    .update({ stripe_customer_id: customer.id })
    .eq('user_id', user.id)
  if (error) throw new Error(`saving customer failed: ${error.message}`)
  return { customerId: customer.id, subscriptionId: null, status: null }
}

const doneUrl = (status: string) => `${FUNCTION_URL}/checkout-done?status=${status}`

export async function createCheckout(user: AppUser, plan: string) {
  if (!PLANS[plan]) throw new HttpError(400, 'Unknown plan')
  const stripe = getStripe()
  let account = await getAccount(user)
  if (account.needs_sync) {
    await syncUser(user.id)
    account = await getAccount(user)
  }
  const { customerId, subscriptionId, status } = await customerFor(stripe, user)

  // Already subscribed (or a renewal payment is failing): changing plan or fixing the card
  // happens in the Stripe portal, so a second subscription is never started.
  if (account.active || ['past_due', 'unpaid'].includes(status ?? '')) {
    if (account.active && account.plan === plan) throw new HttpError(409, 'You are already on this plan')
    const portal = { customer: customerId, return_url: doneUrl('portal') }
    const session = await stripe.billingPortal.sessions
      .create({
        ...portal,
        flow_data: { type: 'subscription_update', subscription_update: { subscription: subscriptionId! } },
      })
      // Plan switching is off in the portal settings: open the plain portal instead.
      .catch(() => stripe.billingPortal.sessions.create(portal))
    return { url: session.url }
  }

  const metadata = { app: APP, copalat_user_id: user.id, copalat_plan: plan }
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: await priceFor(stripe, plan), quantity: 1 }],
    metadata,
    subscription_data: { metadata },
    allow_promotion_codes: true,
    success_url: `${doneUrl('success')}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: doneUrl('cancel'),
  })
  return { url: session.url }
}

export async function createPortal(user: AppUser) {
  const stripe = getStripe()
  const { data } = await admin
    .from('copalat_accounts')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!data?.stripe_customer_id) throw new HttpError(404, 'No purchases found for this account')

  const session = await stripe.billingPortal.sessions.create({
    customer: data.stripe_customer_id,
    return_url: doneUrl('portal'),
  })
  return { url: session.url }
}

const DONE_MESSAGES: Record<string, string> = {
  success: 'Payment received. Your Copalat plan is now active. You can close this tab and go back to Upwork.',
  cancel: 'Checkout was cancelled. You can close this tab.',
  portal: 'You can close this tab and go back to Upwork.',
}

// Page Stripe sends the browser to after checkout. Activates the plan straight away from
// the session id, so the user is not left waiting for the webhook.
export async function checkoutDone(req: Request) {
  const params = new URL(req.url).searchParams
  const sessionId = params.get('session_id')
  if (sessionId && stripeConfigured()) {
    try {
      const stripe = getStripe()
      const session = await stripe.checkout.sessions.retrieve(sessionId)
      const subscriptionId = idOf(session.subscription)
      if (session.metadata?.app === APP && subscriptionId) await syncSubscription(stripe, subscriptionId)
    } catch (err) {
      console.error('checkout-done sync failed', err)
    }
  }
  return text(DONE_MESSAGES[params.get('status') ?? ''] ?? DONE_MESSAGES.portal)
}

// Stripe webhook. With COPALAT_STRIPE_WEBHOOK_SECRET set the signature is verified;
// without it the event id is looked up on Stripe instead, so a forged request cannot
// invent an event. Either way the subscription itself is re-read from Stripe.
export async function handleWebhook(req: Request) {
  const stripe = getStripe()
  const body = await req.text()
  const webhookSecret = Deno.env.get('COPALAT_STRIPE_WEBHOOK_SECRET')

  let event: Stripe.Event
  try {
    if (webhookSecret) {
      const signature = req.headers.get('Stripe-Signature') ?? ''
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret, undefined, cryptoProvider)
    } else {
      event = await stripe.events.retrieve(JSON.parse(body).id)
    }
  } catch {
    return json({ error: 'Invalid event' }, 400)
  }

  try {
    if (event.type.startsWith('customer.subscription.')) {
      await syncSubscription(stripe, (event.data.object as Stripe.Subscription).id)
    } else if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const subscriptionId = idOf(session.subscription)
      if (session.metadata?.app === APP && subscriptionId) await syncSubscription(stripe, subscriptionId)
    }
  } catch (err) {
    console.error(err)
    // 500 makes Stripe retry the event later.
    return json({ error: 'Webhook handling failed' }, 500)
  }
  return json({ received: true })
}
