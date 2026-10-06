import 'server-only'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { requireAdmin } from './auth'

// List prices per month, for the revenue estimate. Stripe is the source of truth.
export const PLAN_PRICES = { starter: 9, pro: 15, unlimited: 99 } as const

// Rows of the copalat_admin_* views (supabase/migrations/*_copalat_admin.sql).
export type AdminUser = {
  id: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
  created_at: string
  last_sign_in_at: string | null
  is_paid: boolean
  plan: 'starter' | 'pro' | 'unlimited' | null
  billing_status: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  stripe_customer_id: string | null
  trial_used: number
  quota_used: number
  quota_limit: number
  has_profile: boolean
  about: string
  proposals_total: number
  last_proposal_at: string | null
}

export type AdminProposal = {
  id: string
  user_id: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
  job_url: string | null
  job_title: string | null
  tone: string | null
  length: string | null
  content: string
  answers: { question: string; answer: string }[]
  job_description: string | null
  job_skills: string[] | null
  instructions: string | null
  profile_name: string | null
  created_at: string
}

export type AdminStats = {
  users_total: number
  users_new_7d: number
  users_active_7d: number
  users_activated: number
  users_with_profile: number
  paid_total: number
  paid_starter: number
  paid_pro: number
  paid_unlimited: number
  paid_cancelling: number
  payment_failing: number
  trial_ended: number
  proposals_total: number
  proposals_24h: number
  proposals_7d: number
}

export type AdminDay = { day: string; signups: number; proposals: number }

let client: SupabaseClient | null = null

// Every read and write goes through here, so no page can query without an admin session.
export async function adminDb() {
  await requireAdmin()
  if (!client) {
    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set')
    client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  }
  return client
}

export function unwrap<T>({ data, error }: { data: T | null; error: { message: string } | null }): T {
  if (error) throw new Error(error.message)
  return data as T
}

// A row of copalat_freelancer_profiles: one of the profiles a user has saved.
export type FreelancerProfile = {
  id: string
  name: string
  about: string
  is_default: boolean
  updated_at: string
}
