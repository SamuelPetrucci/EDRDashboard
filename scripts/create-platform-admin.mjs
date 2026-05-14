/**
 * Create (or promote) a Supabase Auth user and set public.profiles.role = platform_admin.
 * Uses the service role key — never commit it or use a VITE_* name for secrets.
 *
 * Use this for the *first* platform admin (before anyone can use /app/platform-admin invites).
 *
 * From project root (reads .env like seed-demo-users):
 *   node scripts/create-platform-admin.mjs admin@your.org "YourTempPassword!" "Full Name"
 *
 * Or via environment:
 *   PLATFORM_ADMIN_EMAIL=... PLATFORM_ADMIN_PASSWORD=... PLATFORM_ADMIN_DISPLAY_NAME="..." node scripts/create-platform-admin.mjs
 *
 * Requires: VITE_SUPABASE_URL or SUPABASE_URL, and SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY.
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

function applyEnvLine(key, val) {
  if (!key || val === undefined) return
  const cur = process.env[key]
  if (cur === undefined || String(cur).trim() === '') process.env[key] = val
}

function loadDotEnvFile(filename) {
  const p = resolve(process.cwd(), filename)
  if (!existsSync(p)) return
  let raw = readFileSync(p, 'utf8')
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1)
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq === -1) continue
    const key = t.slice(0, eq).trim()
    let val = t.slice(eq + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    applyEnvLine(key, val)
  }
}

loadDotEnvFile('.env')
loadDotEnvFile('.env.local')

const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim()
const SERVICE_KEY = (
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SERVICE_ROLE_KEY ||
  ''
).trim()

const argv = process.argv.slice(2).filter((a) => a !== '--')
const emailArg = argv[0] || process.env.PLATFORM_ADMIN_EMAIL || ''
const passwordArg = argv[1] || process.env.PLATFORM_ADMIN_PASSWORD || ''
const nameArg =
  argv.slice(2).join(' ').trim() ||
  process.env.PLATFORM_ADMIN_DISPLAY_NAME ||
  ''

function usage() {
  console.error(`
Create a platform administrator (Auth user + profiles.role).

  node scripts/create-platform-admin.mjs <email> <password> [display name]

Or set PLATFORM_ADMIN_EMAIL, PLATFORM_ADMIN_PASSWORD, and optionally PLATFORM_ADMIN_DISPLAY_NAME.

Needs in .env: VITE_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY).
`)
}

if (!SUPABASE_URL || !SERVICE_KEY) {
  usage()
  if (!SUPABASE_URL) console.error('Missing: VITE_SUPABASE_URL or SUPABASE_URL')
  if (!SERVICE_KEY) console.error('Missing: SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const email = String(emailArg).trim()
const password = String(passwordArg).trim()
const displayName = (nameArg.trim() || email.split('@')[0] || 'Platform Admin').trim()

if (!email || !password) {
  usage()
  process.exit(1)
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function findUserIdByEmail(em) {
  let page = 1
  const perPage = 1000
  for (let i = 0; i < 20; i++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error) throw error
    const hit = data.users.find((u) => u.email?.toLowerCase() === em.toLowerCase())
    if (hit) return hit.id
    if (data.users.length < perPage) break
    page += 1
  }
  return null
}

async function grantPlatformCountryAccess(userId) {
  const { data: jm, error: jmErr } = await admin.from('countries').select('id').eq('slug', 'jamaica').maybeSingle()
  if (jmErr || !jm?.id) {
    console.warn('(skip country access: no jamaica row — apply migrations / seed countries)')
    return
  }
  const { data: us } = await admin.from('countries').select('id').eq('slug', 'united-states').maybeSingle()
  const rows = [{ user_id: userId, country_id: jm.id }]
  if (us?.id) rows.push({ user_id: userId, country_id: us.id })
  const { error } = await admin.from('user_country_access').upsert(rows, { onConflict: 'user_id,country_id' })
  if (error) console.warn('user_country_access:', error.message)
}

async function main() {
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: displayName },
  })

  let userId = created?.user?.id
  let createdNew = true

  if (createErr) {
    const msg = createErr.message || ''
    if (!/already|registered|exists/i.test(msg)) throw createErr
    createdNew = false
    userId = await findUserIdByEmail(email)
    if (!userId) throw new Error(`Could not resolve user id for ${email}`)
    const { error: updErr } = await admin.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
      user_metadata: { full_name: displayName },
    })
    if (updErr) throw updErr
    console.log(`User already existed; updated password / metadata for ${email}`)
  }

  const { error: profErr } = await admin.from('profiles').upsert(
    {
      id: userId,
      role: 'platform_admin',
      display_name: displayName,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  )
  if (profErr) throw profErr

  await grantPlatformCountryAccess(userId)

  console.log(
    createdNew
      ? `Created platform_admin: ${email} (sign in and change password if this was temporary).`
      : `Promoted to platform_admin: ${email}`
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
