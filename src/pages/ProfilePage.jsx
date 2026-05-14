import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'
import '../styles/dris-dashboard.css'
import './ProfilePage.css'

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth()
  const [displayName, setDisplayName] = useState('')
  const [phone, setPhone] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [locale, setLocale] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setDisplayName(profile?.display_name ?? '')
    setPhone(profile?.phone ?? '')
    setJobTitle(profile?.job_title ?? '')
    setLocale(profile?.locale ?? '')
  }, [profile])

  const onSaveProfile = useCallback(
    async (e) => {
      e.preventDefault()
      setErr('')
      setMsg('')
      if (!supabase || !user?.id) {
        setErr('Sign in is required.')
        return
      }
      setSaving(true)
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName.trim() || null,
          phone: phone.trim() || null,
          job_title: jobTitle.trim() || null,
          locale: locale.trim() || null,
        })
        .eq('id', user.id)
      setSaving(false)
      if (error) {
        setErr(error.message || 'Could not save profile.')
        return
      }
      setMsg('Profile saved.')
      await refreshProfile()
    },
    [displayName, phone, jobTitle, locale, refreshProfile, user?.id]
  )

  const onChangePassword = useCallback(
    async (e) => {
      e.preventDefault()
      setErr('')
      setMsg('')
      if (!supabase) {
        setErr('Supabase is not configured.')
        return
      }
      if (password.length < 8) {
        setErr('Password must be at least 8 characters.')
        return
      }
      if (password !== password2) {
        setErr('Passwords do not match.')
        return
      }
      setSaving(true)
      const { error } = await supabase.auth.updateUser({ password })
      setSaving(false)
      if (error) {
        setErr(error.message || 'Could not update password.')
        return
      }
      setPassword('')
      setPassword2('')
      setMsg('Password updated.')
    },
    [password, password2]
  )

  if (!isSupabaseConfigured) {
    return (
      <div className="dris-dashboard">
        <p className="dris-muted">Profile management requires Supabase configuration.</p>
      </div>
    )
  }

  return (
    <div className="dris-dashboard profile-page">
      <h1 className="dris-dashboard__page-title">Your profile</h1>
      <p className="dris-muted profile-page__lede">Update how you appear in DRIS and your account password.</p>

      {err ? <p className="profile-page__banner profile-page__banner--err">{err}</p> : null}
      {msg ? <p className="profile-page__banner profile-page__banner--ok">{msg}</p> : null}

      <div className="dris-card profile-page__card">
        <h2 className="dris-card__title">Account</h2>
        <div className="dris-card__body">
          <p className="profile-page__row">
            <span className="dris-muted">Email</span>
            <strong>{user?.email ?? '—'}</strong>
          </p>
        </div>
      </div>

      <form className="dris-card profile-page__card" onSubmit={onSaveProfile}>
        <h2 className="dris-card__title">Profile details</h2>
        <div className="dris-card__body profile-page__form">
          <label className="profile-page__label">
            Display name
            <input className="dris-dashboard__search" value={displayName} onChange={(e) => setDisplayName(e.target.value)} autoComplete="name" />
          </label>
          <label className="profile-page__label">
            Phone
            <input className="dris-dashboard__search" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
          </label>
          <label className="profile-page__label">
            Job title
            <input className="dris-dashboard__search" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
          </label>
          <label className="profile-page__label">
            Locale
            <input className="dris-dashboard__search" value={locale} onChange={(e) => setLocale(e.target.value)} placeholder="e.g. en-JM" />
          </label>
          <button type="submit" className="profile-page__btn" disabled={saving}>
            Save profile
          </button>
        </div>
      </form>

      <form className="dris-card profile-page__card" onSubmit={onChangePassword}>
        <h2 className="dris-card__title">Change password</h2>
        <div className="dris-card__body profile-page__form">
          <label className="profile-page__label">
            New password
            <input className="dris-dashboard__search" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
          </label>
          <label className="profile-page__label">
            Confirm password
            <input className="dris-dashboard__search" type="password" value={password2} onChange={(e) => setPassword2(e.target.value)} autoComplete="new-password" />
          </label>
          <button type="submit" className="profile-page__btn" disabled={saving}>
            Update password
          </button>
        </div>
      </form>
    </div>
  )
}
