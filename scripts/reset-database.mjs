/**
 * Nuclear reset: delete ALL Auth users, DROP public schema, recreate empty public + grants.
 *
 * Use ONLY on disposable dev/staging projects — irreversible data loss.
 *
 * Prerequisites:
 *   npm install   (includes devDependency `pg`)
 *
 * Environment (.env):
 *   DATABASE_URL — Postgres connection string (Supabase Dashboard → Connect → URI).
 *                  Prefer session mode / direct connection if pooler rejects DDL.
 *   SUPABASE_URL or VITE_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY — to purge Auth users via Admin API
 *
 * Safety gate (required):
 *   CONFIRM_DRIS_DATABASE_RESET=yes
 *
 * Optional:
 *   SKIP_AUTH_PURGE=1       — only reset public schema (keeps Auth users; may leave orphaned metadata)
 *   SKIP_SCHEMA_DROP=1      — only delete Auth users (keeps public tables)
 *
 * After running:
 *   supabase db push
 *   — or paste migrations in SQL Editor in timestamp order — then npm run seed:demo / create:platform-admin
 *
 * Local alternative (CLI): supabase db reset   — resets linked local Docker DB only.
 */

import { createClient } from '@supabase/supabase-js'
import pg from 'pg'
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

const DATABASE_URL = String(process.env.DATABASE_URL || '').trim()
const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim()
const SERVICE_KEY = (
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SERVICE_ROLE_KEY ||
  ''
).trim()

const skipAuth = String(process.env.SKIP_AUTH_PURGE || '').toLowerCase() === '1'
const skipSchema = String(process.env.SKIP_SCHEMA_DROP || '').toLowerCase() === '1'

async function purgeAuthUsers() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('Missing SUPABASE_URL (or VITE_SUPABASE_URL) or SUPABASE_SERVICE_ROLE_KEY — cannot purge Auth.')
    process.exit(1)
  }
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  let page = 1
  const perPage = 1000
  let total = 0
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error) throw error
    const users = data.users || []
    for (const u of users) {
      const { error: dErr } = await admin.auth.admin.deleteUser(u.id)
      if (dErr) console.warn(`  deleteUser ${u.email ?? u.id}: ${dErr.message}`)
      else total += 1
    }
    if (users.length < perPage) break
    page += 1
  }
  console.log(`Purged ${total} Auth user(s).`)
}

async function resetPublicSchema() {
  if (!DATABASE_URL) {
    console.error('Missing DATABASE_URL — cannot DROP/CREATE public schema.')
    console.error('Supabase Dashboard → Project Settings → Database → Connection string (URI).')
    process.exit(1)
  }

  const client = new pg.Client({
    connectionString: DATABASE_URL,
    ssl: DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
  })

  await client.connect()

  try {
    await client.query('BEGIN')
    await client.query('DROP SCHEMA IF EXISTS public CASCADE')
    await client.query('CREATE SCHEMA public')

    await client.query('GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role')
    await client.query(
      'GRANT ALL ON SCHEMA public TO postgres, anon, authenticated, service_role'
    )

    await client.query(`
      ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
      GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role
    `)
    await client.query(`
      ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
      GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role
    `)
    await client.query(`
      ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
      GRANT ALL ON FUNCTIONS TO postgres, anon, authenticated, service_role
    `)

    await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`)
    await client.query('COMMIT')
    console.log('Dropped and recreated schema public; uuid-ossp ensured.')
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {})
    throw e
  } finally {
    await client.end()
  }
}

async function main() {
  if (process.env.CONFIRM_DRIS_DATABASE_RESET !== 'yes') {
    console.error(`
Refusing to run: set CONFIRM_DRIS_DATABASE_RESET=yes

This destroys Auth users and/or the entire public schema.
`)
    process.exit(1)
  }

  console.log('DRIS database reset starting…')

  if (!skipAuth) {
    await purgeAuthUsers()
  } else {
    console.log('SKIP_AUTH_PURGE=1 — leaving Auth users unchanged.')
  }

  if (!skipSchema) {
    await resetPublicSchema()
  } else {
    console.log('SKIP_SCHEMA_DROP=1 — leaving public schema unchanged.')
  }

  console.log(`
Next steps:
  • Apply migrations:  supabase db push   (remote)   or   supabase db reset   (local CLI stack)
  • Bootstrap admin:   node scripts/create-platform-admin.mjs …
  • Demo users:        npm run seed:demo
`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
