import 'server-only'
import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const COOKIE = 'admin_session'
const MAX_AGE = 60 * 60 * 24 * 7

const password = () => {
  const value = process.env.ADMIN_PASSWORD
  if (!value) throw new Error('ADMIN_PASSWORD is not set')
  return value
}

// The cookie holds an HMAC keyed by the password, so changing the password
// signs everyone out and the password itself never leaves the server.
const sessionToken = () => createHmac('sha256', password()).update('copalat-admin').digest('hex')

const sha = (value: string) => createHash('sha256').update(value).digest()
const safeEqual = (a: string, b: string) => timingSafeEqual(sha(a), sha(b))

export async function isAdmin() {
  const token = (await cookies()).get(COOKIE)?.value
  return Boolean(token) && safeEqual(token!, sessionToken())
}

export async function requireAdmin() {
  if (!(await isAdmin())) redirect('/login')
}

export async function signIn(candidate: string) {
  if (!safeEqual(candidate, password())) return false
  ;(await cookies()).set(COOKIE, sessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  })
  return true
}

export async function signOut() {
  ;(await cookies()).delete(COOKIE)
}
