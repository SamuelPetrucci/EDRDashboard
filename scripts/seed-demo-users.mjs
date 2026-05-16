/**
 * Creates (or updates) three DRIS demo Auth users and sets public.profiles.role for each.
 * Requires Supabase secret key — never expose in the browser.
 *
 * Usage (from project root, with .env containing keys):
 *   node scripts/seed-demo-users.mjs
 *
 * Reads: VITE_SUPABASE_URL or SUPABASE_URL,
 *        SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY (service role / secret key),
 *        VITE_DEMO_PASSWORD or DEMO_SEED_PASSWORD (optional; default DRIS-Demo-2026!)
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
const DEMO_PW = (
  process.env.VITE_DEMO_PASSWORD ||
  process.env.DEMO_SEED_PASSWORD ||
  'DRIS-Demo-2026!'
).trim()

const ACCOUNTS = [
  { email: 'demo-admin@dris.local', role: 'country_admin', name: 'Demo Administrator' },
  { email: 'demo-manager@dris.local', role: 'parish_manager', name: 'Demo Parish Manager' },
  { email: 'demo-data@dris.local', role: 'data_officer', name: 'Demo Data Officer' },
]

if (!SUPABASE_URL || !SERVICE_KEY) {
  if (!SUPABASE_URL) {
    console.error('Missing project URL: set VITE_SUPABASE_URL or SUPABASE_URL in .env (Supabase root, e.g. https://xxxx.supabase.co).')
  }
  if (!SERVICE_KEY) {
    console.error(
      'Missing service role key: set SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY in .env (Dashboard → Settings → API → Secret / service_role key). Never use VITE_* for this.'
    )
  }
  process.exit(1)
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function findUserIdByEmail(email) {
  let page = 1
  const perPage = 1000
  for (let i = 0; i < 20; i++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error) throw error
    const hit = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
    if (hit) return hit.id
    if (data.users.length < perPage) break
    page += 1
  }
  return null
}

async function upsertDemoUser({ email, role, name }) {
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password: DEMO_PW,
    email_confirm: true,
    user_metadata: { full_name: name },
  })

  let userId = created?.user?.id

  if (createErr) {
    const msg = createErr.message || ''
    if (!/already|registered|exists/i.test(msg)) {
      throw createErr
    }
    userId = await findUserIdByEmail(email)
    if (!userId) throw new Error(`Could not resolve user id for ${email}`)
    const { error: updErr } = await admin.auth.admin.updateUserById(userId, {
      password: DEMO_PW,
      email_confirm: true,
      user_metadata: { full_name: name },
    })
    if (updErr) throw updErr
  }

  const { error: profErr } = await admin.from('profiles').upsert(
    { id: userId, role, display_name: name, updated_at: new Date().toISOString() },
    { onConflict: 'id' }
  )
  if (profErr) throw profErr

  console.log(`OK  ${email} → ${role}`)
  return userId
}

async function ensureGeoAccess(admin, userId, email) {
  const { data: jm, error: jmErr } = await admin.from('countries').select('id').eq('slug', 'jamaica').maybeSingle()
  if (jmErr || !jm?.id) {
    console.warn('  (skip geo access: run latest Supabase migrations for countries / user_country_access)')
    return
  }
  const { data: us } = await admin.from('countries').select('id').eq('slug', 'united-states').maybeSingle()

  const em = email.toLowerCase()
  if (em.includes('demo-admin')) {
    const rows = [{ user_id: userId, country_id: jm.id }]
    if (us?.id) rows.push({ user_id: userId, country_id: us.id })
    const { error } = await admin.from('user_country_access').upsert(rows, { onConflict: 'user_id,country_id' })
    if (error) console.warn('  user_country_access:', error.message)
    return
  }

  if (em.includes('demo-data')) {
    const { error } = await admin.from('user_country_access').upsert(
      { user_id: userId, country_id: jm.id },
      { onConflict: 'user_id,country_id' }
    )
    if (error) console.warn('  user_country_access:', error.message)
    return
  }

  if (em.includes('demo-manager')) {
    const { error: cErr } = await admin.from('user_country_access').upsert(
      { user_id: userId, country_id: jm.id },
      { onConflict: 'user_id,country_id' }
    )
    if (cErr) console.warn('  user_country_access:', cErr.message)
    const { data: par } = await admin.from('jurisdictions').select('id').eq('code', 'kingston').eq('country_id', jm.id).maybeSingle()
    if (par?.id) {
      const { error: jErr } = await admin.from('user_jurisdiction_access').upsert(
        { user_id: userId, jurisdiction_id: par.id },
        { onConflict: 'user_id,jurisdiction_id' }
      )
      if (jErr) console.warn('  user_jurisdiction_access:', jErr.message)
    }
  }
}

async function main() {
  console.log('Seeding DRIS demo users (password from env or default)…')
  for (const row of ACCOUNTS) {
    const userId = await upsertDemoUser(row)
    if (userId) await ensureGeoAccess(admin, userId, row.email)
  }
  console.log('Done. Use the emails above with the demo password on /sign-in.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
