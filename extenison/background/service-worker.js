// Service worker: owns the Supabase session and talks to the backend for the popup and
// the widget on the Upwork proposal page. Each message { action, payload } is answered
// with { ok: true, data } or { ok: false, error, ... }.
import { UI_CONFIG } from '../lib/config.js'
import { callFunction, getValidSession, signInWithGoogle, signOut } from '../lib/supabase.js'

const SIGNED_OUT = { user: null, account: null, selectors: {}, config: UI_CONFIG }

async function getState() {
  const session = await getValidSession()
  if (!session) return SIGNED_OUT
  try {
    const { account, selectors } = await callFunction('account')
    return { user: session.user, account, selectors, config: UI_CONFIG }
  } catch (error) {
    if (error?.details?.code === 'auth') return SIGNED_OUT
    throw error
  }
}

async function openTab(route, body) {
  const { url } = await callFunction(route, body)
  await chrome.tabs.create({ url })
}

const handlers = {
  GET_STATE: getState,
  SIGN_IN: async () => {
    await signInWithGoogle()
    return getState()
  },
  SIGN_OUT: async () => {
    await signOut()
    return SIGNED_OUT
  },
  GENERATE: (payload) => callFunction('generate', payload),
  SAVE_SETTINGS: (payload) => callFunction('settings', payload),
  GET_HISTORY: () => callFunction('history'),
  CHECKOUT: (payload) => openTab('checkout', { plan: payload?.plan }),
  PORTAL: () => openTab('portal'),
}

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  const handler = handlers[request?.action]
  if (!handler) return
  handler(request.payload).then(
    (data) => sendResponse({ ok: true, data }),
    (error) => sendResponse({ ok: false, error: error?.message, ...error?.details }),
  )
  // Keeps the message channel open for the async answer.
  return true
})
