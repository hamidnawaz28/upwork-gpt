'use client'

export default function AdminError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <section className="card error-card">
      <h2>Could not load this page</h2>
      <p className="muted">{error.message}</p>
      <p className="muted">
        Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local, and that the migrations in supabase/migrations
        have been applied.
      </p>
      <button type="button" onClick={reset}>
        Try again
      </button>
    </section>
  )
}
