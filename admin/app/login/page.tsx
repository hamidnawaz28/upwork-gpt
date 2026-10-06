import { redirect } from 'next/navigation'
import { isAdmin, signIn } from '@/lib/auth'

async function login(formData: FormData) {
  'use server'
  const ok = await signIn(String(formData.get('password') || ''))
  redirect(ok ? '/' : '/login?error=1')
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await isAdmin()) redirect('/')
  const { error } = await searchParams
  return (
    <main className="login">
      <form action={login} className="login-card">
        <img src="/logo.svg" alt="" width={44} height={44} />
        <h1>Copalat Admin</h1>
        <p className="muted">Sign in to see users, revenue and proposals.</p>
        <label htmlFor="password">Admin password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required autoFocus />
        {error && (
          <p className="error" role="alert">
            Wrong password. Try again.
          </p>
        )}
        <button type="submit">Sign in</button>
      </form>
    </main>
  )
}
