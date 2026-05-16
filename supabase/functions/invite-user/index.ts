import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type InviteBody = {
  email?: string
  intendedRole?: string
  countrySlugs?: string[]
  personalMessage?: string
  expiresInDays?: number
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

  if (!supabaseUrl || !anonKey || !serviceKey) {
    return new Response(JSON.stringify({ error: 'Server misconfigured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const authHeader = req.headers.get('Authorization') ?? ''
  const jwt = authHeader.replace(/^Bearer\s+/i, '').trim()
  if (!jwt) {
    return new Response(JSON.stringify({ error: 'Missing Authorization' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const {
    data: { user },
    error: userErr,
  } = await userClient.auth.getUser(jwt)
  if (userErr || !user) {
    return new Response(JSON.stringify({ error: userErr?.message || 'Invalid session' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { data: prof, error: profErr } = await userClient.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (profErr || prof?.role !== 'country_admin') {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let body: InviteBody
  try {
    body = (await req.json()) as InviteBody
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const email = String(body.email ?? '')
    .trim()
    .toLowerCase()
  const intendedRole = String(body.intendedRole ?? '').trim()
  const countrySlugs = Array.isArray(body.countrySlugs) ? body.countrySlugs.map((s) => String(s).trim().toLowerCase()) : []

  if (!email || !email.includes('@')) {
    return new Response(JSON.stringify({ error: 'Valid email is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const allowedRoles = ['country_admin', 'parish_manager', 'data_officer']
  if (!allowedRoles.includes(intendedRole)) {
    return new Response(JSON.stringify({ error: 'Invalid intendedRole' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (countrySlugs.length === 0) {
    return new Response(JSON.stringify({ error: 'Select at least one country' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const days = typeof body.expiresInDays === 'number' && body.expiresInDays > 0 ? body.expiresInDays : 14
  const expiresAt = new Date(Date.now() + days * 86400000).toISOString()

  const adminClient = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: countries, error: cErr } = await adminClient.from('countries').select('id, slug').in('slug', countrySlugs)
  if (cErr || !countries?.length) {
    return new Response(JSON.stringify({ error: cErr?.message || 'Unknown country slug' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { data: invRow, error: invErr } = await userClient
    .from('user_invitations')
    .insert({
      email,
      invited_by: user.id,
      intended_role: intendedRole,
      status: 'pending',
      expires_at: expiresAt,
      personal_message: body.personalMessage ? String(body.personalMessage).slice(0, 2000) : null,
    })
    .select('id')
    .single()

  if (invErr || !invRow?.id) {
    return new Response(JSON.stringify({ error: invErr?.message || 'Could not create invitation' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const invitationId = invRow.id as string

  const scopeRows = countries.map((c: { id: string }) => ({
    invitation_id: invitationId,
    country_id: c.id,
    jurisdiction_id: null,
  }))

  const { error: scopeErr } = await userClient.from('user_invitation_scopes').insert(scopeRows)
  if (scopeErr) {
    await adminClient.from('user_invitations').delete().eq('id', invitationId)
    return new Response(JSON.stringify({ error: scopeErr.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { data: inviteData, error: inviteErr } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: { dris_invitation_id: invitationId },
    redirectTo: undefined,
  })

  if (inviteErr) {
    await adminClient.from('user_invitation_scopes').delete().eq('invitation_id', invitationId)
    await adminClient.from('user_invitations').delete().eq('id', invitationId)
    return new Response(JSON.stringify({ error: inviteErr.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  await adminClient
    .from('user_invitations')
    .update({ invite_sent_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', invitationId)

  return new Response(
    JSON.stringify({
      ok: true,
      invitationId,
      authUserId: inviteData.user?.id ?? null,
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
