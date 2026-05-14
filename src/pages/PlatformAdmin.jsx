import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'
import { postInviteUserEdge } from '../lib/inviteUserEdge'
import { DRIS_ROLES, ROLE_LABELS } from '../constants/roles'
import '../styles/dris-dashboard.css'
import './PlatformAdmin.css'

const INVITE_ROLES = [
  DRIS_ROLES.COUNTRY_EXECUTIVE,
  DRIS_ROLES.COUNTRY_ADMIN,
  DRIS_ROLES.PARISH_MANAGER,
  DRIS_ROLES.DATA_OFFICER,
  DRIS_ROLES.FIELD_USER,
  DRIS_ROLES.AUDITOR,
]

export default function PlatformAdmin() {
  const { session, refreshProfile } = useAuth()
  const [users, setUsers] = useState([])
  const [loadErr, setLoadErr] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState(DRIS_ROLES.FIELD_USER)
  const [inviteJm, setInviteJm] = useState(true)
  const [inviteUs, setInviteUs] = useState(false)
  const [inviteMsg, setInviteMsg] = useState('')
  const [inviteErr, setInviteErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [countries, setCountries] = useState([])
  const [grantUserId, setGrantUserId] = useState('')
  const [grantJm, setGrantJm] = useState(true)
  const [grantUs, setGrantUs] = useState(false)
  const [grantMsg, setGrantMsg] = useState('')

  const loadUsers = useCallback(async () => {
    if (!supabase) return
    setLoadErr('')
    const { data, error } = await supabase.rpc('admin_list_users')
    if (error) {
      setLoadErr(error.message || 'Could not load users.')
      setUsers([])
      return
    }
    setUsers(Array.isArray(data) ? data : [])
  }, [])

  const loadCountries = useCallback(async () => {
    if (!supabase) return
    const { data } = await supabase.from('countries').select('id, slug, name').eq('is_active', true).order('name')
    setCountries(data ?? [])
  }, [])

  useEffect(() => {
    loadUsers()
    loadCountries()
  }, [loadCountries, loadUsers])

  const onInvite = useCallback(
    async (e) => {
      e.preventDefault()
      setInviteErr('')
      setInviteMsg('')
      const slugs = []
      if (inviteJm) slugs.push('jamaica')
      if (inviteUs) slugs.push('united-states')
      if (!inviteEmail.trim() || slugs.length === 0) {
        setInviteErr('Email and at least one country are required.')
        return
      }
      const token = session?.access_token
      if (!token) {
        setInviteErr('Session expired. Sign in again.')
        return
      }
      setBusy(true)
      const result = await postInviteUserEdge({
        accessToken: token,
        body: {
          email: inviteEmail.trim(),
          intendedRole: inviteRole,
          countrySlugs: slugs,
        },
      })
      setBusy(false)
      if (result.error) {
        setInviteErr(result.error)
        return
      }
      setInviteMsg('Invitation sent.')
      setInviteEmail('')
      await loadUsers()
      await refreshProfile()
    },
    [inviteEmail, inviteJm, inviteRole, inviteUs, loadUsers, refreshProfile, session?.access_token]
  )

  const onGrantCountries = useCallback(
    async (e) => {
      e.preventDefault()
      setGrantMsg('')
      if (!supabase || !grantUserId) {
        setGrantMsg('Select a user.')
        return
      }
      const rows = []
      if (grantJm) {
        const jm = countries.find((c) => c.slug === 'jamaica')
        if (jm) rows.push({ user_id: grantUserId, country_id: jm.id })
      }
      if (grantUs) {
        const us = countries.find((c) => c.slug === 'united-states')
        if (us) rows.push({ user_id: grantUserId, country_id: us.id })
      }
      if (rows.length === 0) {
        setGrantMsg('Pick at least one country.')
        return
      }
      setBusy(true)
      const { error } = await supabase.from('user_country_access').upsert(rows, { onConflict: 'user_id,country_id' })
      setBusy(false)
      if (error) {
        setGrantMsg(error.message || 'Could not grant access.')
        return
      }
      setGrantMsg('Country access saved.')
    },
    [countries, grantJm, grantUs, grantUserId]
  )

  if (!isSupabaseConfigured) {
    return (
      <div className="dris-dashboard">
        <p className="dris-muted">Platform admin requires Supabase.</p>
      </div>
    )
  }

  return (
    <div className="dris-dashboard platform-admin">
      <h1 className="dris-dashboard__page-title">Platform administration</h1>
      <p className="dris-muted platform-admin__lede">Invite users by email and manage country access (v1: Jamaica and United States).</p>

      <div className="dris-dashboard__grid dris-dashboard__grid--triple platform-admin__grid">
        <form className="dris-card" onSubmit={onInvite}>
          <h2 className="dris-card__title">Invite user</h2>
          <div className="dris-card__body platform-admin__form">
            {inviteErr ? <p className="platform-admin__note platform-admin__note--err">{inviteErr}</p> : null}
            {inviteMsg ? <p className="platform-admin__note platform-admin__note--ok">{inviteMsg}</p> : null}
            <label className="platform-admin__label">
              Email
              <input className="dris-dashboard__search" type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required />
            </label>
            <label className="platform-admin__label">
              Role
              <select className="dris-dashboard__search" value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
                {INVITE_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r] || r}
                  </option>
                ))}
              </select>
            </label>
            <fieldset className="platform-admin__fieldset">
              <legend className="dris-muted">Countries</legend>
              <label className="platform-admin__check">
                <input type="checkbox" checked={inviteJm} onChange={(e) => setInviteJm(e.target.checked)} /> Jamaica
              </label>
              <label className="platform-admin__check">
                <input type="checkbox" checked={inviteUs} onChange={(e) => setInviteUs(e.target.checked)} /> United States
              </label>
            </fieldset>
            <button type="submit" className="platform-admin__btn" disabled={busy}>
              Send invite
            </button>
            <p className="dris-muted platform-admin__hint">Deploy the `invite-user` Edge Function and set secrets so email delivery works.</p>
          </div>
        </form>

        <form className="dris-card" onSubmit={onGrantCountries}>
          <h2 className="dris-card__title">Grant country access</h2>
          <div className="dris-card__body platform-admin__form">
            {grantMsg ? <p className="platform-admin__note">{grantMsg}</p> : null}
            <label className="platform-admin__label">
              User
              <select className="dris-dashboard__search" value={grantUserId} onChange={(e) => setGrantUserId(e.target.value)}>
                <option value="">Select…</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.email} — {u.display_name || u.id.slice(0, 8)}
                  </option>
                ))}
              </select>
            </label>
            <fieldset className="platform-admin__fieldset">
              <legend className="dris-muted">Countries</legend>
              <label className="platform-admin__check">
                <input type="checkbox" checked={grantJm} onChange={(e) => setGrantJm(e.target.checked)} /> Jamaica
              </label>
              <label className="platform-admin__check">
                <input type="checkbox" checked={grantUs} onChange={(e) => setGrantUs(e.target.checked)} /> United States
              </label>
            </fieldset>
            <button type="submit" className="platform-admin__btn" disabled={busy}>
              Save access
            </button>
          </div>
        </form>

        <div className="dris-card">
          <h2 className="dris-card__title">Users</h2>
          <div className="dris-card__body">
            {loadErr ? <p className="platform-admin__note platform-admin__note--err">{loadErr}</p> : null}
            <div className="dris-table-wrap">
              <table className="dris-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Name</th>
                    <th>Role</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>{u.email}</td>
                      <td>{u.display_name || '—'}</td>
                      <td>{ROLE_LABELS[u.role] || u.role}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button type="button" className="platform-admin__btn platform-admin__btn--secondary" onClick={() => loadUsers()}>
              Refresh list
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
