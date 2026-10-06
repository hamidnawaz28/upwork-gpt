// Supabase project that stores Copalat's accounts, usage and proposals.
// The publishable key is safe to ship: every table is locked down and all access goes
// through the "copalat" Edge Function, which checks the signed-in user.
export const SUPABASE_URL = 'https://mivnbjtehikrqxooogcs.supabase.co'
export const SUPABASE_ANON_KEY = 'sb_publishable_5zSKmwia-iQC8ILaMMVJXA_QSxKyIuD'

// Google OAuth client of type "Web application". Its authorized redirect URIs must contain
// https://<extension-id>.chromiumapp.org/ and the same client ID must be listed under
// Supabase → Authentication → Providers → Google → Client IDs.
export const GOOGLE_CLIENT_ID =
  '185322597233-b4t9cml2obqmlqsh72qgm54rptupbgip.apps.googleusercontent.com'

// Sent to the popup and the page widget with every state, so they need no imports.
// Display only: prices and quotas are enforced on the server (Stripe + copalat_plan_limit).
export const UI_CONFIG = {
  freeTrial: 5,
  plans: [
    { id: 'starter', name: 'Starter', price: '$9', proposals: 30 },
    { id: 'pro', name: 'Pro', price: '$15', proposals: 60 },
  ],
  tones: [
    { id: 'professional', label: 'Professional' },
    { id: 'friendly', label: 'Friendly' },
    { id: 'confident', label: 'Confident' },
    { id: 'concise', label: 'Concise' },
  ],
  lengths: [
    { id: 'short', label: 'Short', hint: 'about 90 words' },
    { id: 'medium', label: 'Medium', hint: 'about 150 words' },
    { id: 'detailed', label: 'Detailed', hint: 'about 230 words' },
  ],
}
