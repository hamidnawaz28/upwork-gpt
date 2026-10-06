// A freelancer's saved profiles: several named descriptions of their skills, one of which
// is the default. The chosen one is what proposals are allowed to draw claims from.
import { admin, AppUser, getAccount, HttpError, rpc } from './lib.ts'

const MAX_PROFILES = 10
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const clip = (value: unknown, max: number) => (typeof value === 'string' ? value.trim().slice(0, max) : '')

export async function listProfiles(userId: string) {
  const { data, error } = await admin
    .from('copalat_freelancer_profiles')
    .select('id, name, about, is_default')
    .eq('user_id', userId)
    .order('created_at')
  if (error) throw new Error(`loading profiles failed: ${error.message}`)
  return data ?? []
}

// The profile to write a proposal from: the one asked for if it is the user's own,
// otherwise their default. Null when they have none, or when they chose "None" for
// this proposal (the extension sends the id 'none').
export async function profileFor(userId: string, profileId: unknown) {
  if (profileId === 'none') return null
  const profiles = await listProfiles(userId)
  const chosen = typeof profileId === 'string' ? profiles.find((profile) => profile.id === profileId) : undefined
  return chosen ?? profiles.find((profile) => profile.is_default) ?? null
}

// body.action: 'save' (create, or update when id is given), 'delete' or 'default'.
export async function manageProfiles(user: AppUser, body: Record<string, unknown>) {
  await getAccount(user)
  const id = typeof body.id === 'string' && UUID.test(body.id) ? body.id : null
  let makeDefault: string | null = null

  if (body.action === 'save') {
    const name = clip(body.name, 60) || 'My profile'
    const about = clip(body.about, 3000)
    if (!about) throw new HttpError(400, 'Write a few lines about your skills before saving.')

    if (id) {
      const { error } = await admin
        .from('copalat_freelancer_profiles')
        .update({ name, about })
        .eq('id', id)
        .eq('user_id', user.id)
      if (error) throw new Error(`saving profile failed: ${error.message}`)
      if (body.makeDefault) makeDefault = id
    } else {
      const existing = await listProfiles(user.id)
      if (existing.length >= MAX_PROFILES) {
        throw new HttpError(400, `You can keep up to ${MAX_PROFILES} profiles. Delete one to add another.`)
      }
      const { data, error } = await admin
        .from('copalat_freelancer_profiles')
        .insert({ user_id: user.id, name, about })
        .select('id')
        .single()
      if (error) throw new Error(`saving profile failed: ${error.message}`)
      if (body.makeDefault) makeDefault = data.id
    }
  } else if (body.action === 'delete' && id) {
    const { error } = await admin.from('copalat_freelancer_profiles').delete().eq('id', id).eq('user_id', user.id)
    if (error) throw new Error(`deleting profile failed: ${error.message}`)
  } else if (body.action === 'default' && id) {
    makeDefault = id
  } else {
    throw new HttpError(400, 'Unknown profile action')
  }

  // Keeps exactly one default and mirrors its text onto the account.
  await rpc('copalat_sync_default_profile', { p_user: user.id, p_default: makeDefault })
  return { profiles: await listProfiles(user.id), account: await getAccount(user) }
}
