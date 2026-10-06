import { createClient } from 'npm:@supabase/supabase-js@2'

export const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
export const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/copalat`

export const admin = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
})

// Thrown anywhere in a route to answer with that status and JSON body.
export class HttpError extends Error {
  constructor(public status: number, message: string, public extra: Record<string, unknown> = {}) {
    super(message)
  }
}

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

export const text = (body: string, status = 200) =>
  new Response(body, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })

export interface AppUser {
  id: string
  email: string | null
  name: string | null
}

// Every route except the Stripe ones requires a signed-in Supabase user.
export async function requireUser(req: Request): Promise<AppUser> {
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  const { data } = token ? await admin.auth.getUser(token) : { data: { user: null } }
  const user = data.user
  if (!user) throw new HttpError(401, 'Please sign in first', { code: 'auth' })
  return {
    id: user.id,
    email: user.email ?? null,
    name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
  }
}

export async function rpc<T = any>(fn: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await admin.rpc(fn, args)
  if (error) throw new Error(`${fn} failed: ${error.message}`)
  return data as T
}

export const getAccount = (user: AppUser) =>
  rpc('copalat_get_account', { p_user: user.id, p_email: user.email })
