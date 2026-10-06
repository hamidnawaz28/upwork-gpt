// Minimal Supabase client built on fetch, so the extension needs no bundler.
// Covers Google sign in (via chrome.identity), token refresh and Edge Function calls.
// Only used from the background service worker.
import { GOOGLE_CLIENT_ID, SUPABASE_ANON_KEY, SUPABASE_URL } from './config.js'

const SESSION_KEY = 'supabaseSession'

export async function getSession() {
  const data = await chrome.storage.local.get(SESSION_KEY)
  return data[SESSION_KEY] || null
}

async function saveSession(session) {
  if (session) await chrome.storage.local.set({ [SESSION_KEY]: session })
  else await chrome.storage.local.remove(SESSION_KEY)
}

const toUser = (user) => ({
  id: user.id,
  email: user.email,
  name: user.user_metadata?.full_name || user.user_metadata?.name || user.email,
  avatar: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
})

async function sha256Hex(text) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

// Gets a Google ID token and exchanges it for a Supabase session.
// Must run in the background service worker: the popup closes when the Google window
// takes focus, which would cancel the flow.
export async function signInWithGoogle() {
  // Google requires a nonce for id_token responses; it gets the hash and Supabase gets
  // the raw value so it can verify the token was minted for this sign in.
  const nonce = crypto.randomUUID()

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID)
  authUrl.searchParams.set('response_type', 'id_token')
  authUrl.searchParams.set('redirect_uri', chrome.identity.getRedirectURL())
  authUrl.searchParams.set('scope', 'openid email profile')
  authUrl.searchParams.set('nonce', await sha256Hex(nonce))
  authUrl.searchParams.set('prompt', 'select_account')

  const responseUrl = await chrome.identity.launchWebAuthFlow({
    url: authUrl.href,
    interactive: true,
  })
  const params = new URLSearchParams(new URL(responseUrl).hash.slice(1))
  const error = params.get('error_description') || params.get('error')
  if (error) throw new Error(error)

  const idToken = params.get('id_token')
  if (!idToken) throw new Error('Google sign in did not return an ID token')

  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=id_token`, {
    method: 'POST',
    headers: { apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider: 'google', id_token: idToken, nonce }),
  })
  const data = await res.json()
  if (!res.ok)
    throw new Error(data.msg || data.error_description || data.message || 'Sign in failed')

  await saveSession({
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
    user: toUser(data.user),
  })
}

export async function signOut() {
  const session = await getSession()
  if (session) {
    fetch(`${SUPABASE_URL}/auth/v1/logout`, {
      method: 'POST',
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${session.accessToken}` },
    }).catch(() => {})
  }
  await saveSession(null)
}

async function refreshSession(session) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: { apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: session.refreshToken }),
  })
  if (!res.ok) {
    // Refresh token revoked or expired: the user has to sign in again.
    await saveSession(null)
    return null
  }
  const data = await res.json()
  const next = {
    ...session,
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  }
  await saveSession(next)
  return next
}

// Returns a session whose access token is valid for at least another minute.
export async function getValidSession() {
  const session = await getSession()
  if (!session) return null
  if (session.expiresAt - Date.now() > 60 * 1000) return session
  return refreshSession(session)
}

// Calls a route of the "copalat" Edge Function as the signed-in user. Errors carry the
// server's JSON body in `details` (e.g. { code: 'limit', account }).
export async function callFunction(route, body = {}) {
  const session = await getValidSession()
  if (!session)
    throw Object.assign(new Error('Please sign in first'), { details: { code: 'auth' } })

  const res = await fetch(`${SUPABASE_URL}/functions/v1/copalat/${route}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${session.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    if (res.status === 401) await saveSession(null)
    throw Object.assign(new Error(data.error || `Request failed (${res.status})`), {
      details: data,
    })
  }
  return data
}
