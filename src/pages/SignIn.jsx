import { useState, useCallback } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Loader2, ClipboardCopy, LogIn } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { postSignInPath } from '../constants/roles'
import { DEMO_ACCOUNTS, getDemoPassword, isDemoLoginUiEnabled } from '../constants/demoAccounts'
import skillvantageLogo from '../../skillvantagelogo.png'
import './SignIn.css'

export default function SignIn() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signInWithPassword, isSupabaseConfigured } = useAuth()

  const fromState = typeof location.state?.from === 'string' ? location.state.from : ''

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)

  const showDemoPanel = isSupabaseConfigured && isDemoLoginUiEnabled()
  const demoPassword = getDemoPassword()

  const copyPassword = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(demoPassword)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }, [demoPassword])

  const applyDemoAccount = useCallback(
    (demoEmail) => {
      setEmail(demoEmail)
      setPassword(demoPassword)
      setError('')
    },
    [demoPassword]
  )

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!isSupabaseConfigured) {
      setError('Supabase URL and publishable key are not configured. Add them to .env — see .env.example.')
      return
    }
    setSubmitting(true)
    const { data, error: signErr } = await signInWithPassword(email.trim(), password)
    if (signErr) {
      setSubmitting(false)
      setError(signErr.message || 'Unable to sign in.')
      return
    }

    let role = null
    const uid = data?.session?.user?.id
    if (uid && supabase) {
      const { data: prof, error: profErr } = await supabase.from('profiles').select('role').eq('id', uid).maybeSingle()
      if (profErr) {
        setSubmitting(false)
        setError(profErr.message || 'Signed in, but profile could not be loaded. Run the database migration, then try again.')
        return
      }
      role = prof?.role ?? null
    }

    setSubmitting(false)
    navigate(postSignInPath(role, fromState), { replace: true })
  }

  return (
    <div className="signin-page">
      <div className="signin-page__backdrop" aria-hidden="true" />
      <Link className="signin-page__back" to="/">
        <ArrowLeft size={18} aria-hidden />
        DRIS home
      </Link>
      <div className={`signin-card${showDemoPanel ? ' signin-card--wide' : ''}`}>
        <div className="signin-card__brand">
          <img
            src={skillvantageLogo}
            alt="SkillVantage Enterprise"
            width={180}
            height={56}
            decoding="async"
            className="signin-card__sv-logo"
          />
          <div className="signin-card__brand-text">
            <h1 className="signin-card__title">Sign in</h1>
            <p className="signin-card__subtitle">DRIS™ · Disaster Resilience Intelligence Scorecard™</p>
            <p className="signin-card__byline">SkillVantage Enterprise</p>
          </div>
        </div>
        {showDemoPanel ? (
          <section className="signin-demo" aria-labelledby="signin-demo-heading">
            <h2 id="signin-demo-heading" className="signin-demo__title">
              Demo logins
            </h2>
            <p className="signin-demo__lede">
              One shared password for every demo user. Run <code className="signin-demo__code">npm run seed:demo</code>{' '}
              once (with <code className="signin-demo__code">SUPABASE_SECRET_KEY</code> in{' '}
              <code className="signin-demo__code">.env</code>) to create accounts — see{' '}
              <code className="signin-demo__code">MANUAL_SETUP.md</code>.
            </p>
            <div className="signin-demo__password-row">
              <span className="signin-demo__password-label">Password</span>
              <code className="signin-demo__password">{demoPassword}</code>
              <button type="button" className="signin-demo__copy" onClick={copyPassword}>
                <ClipboardCopy size={16} aria-hidden />
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <ul className="signin-demo__list">
              {DEMO_ACCOUNTS.map((row) => (
                <li key={row.email} className="signin-demo__row">
                  <div className="signin-demo__meta">
                    <span className="signin-demo__role">{row.label}</span>
                    <code className="signin-demo__email">{row.email}</code>
                  </div>
                  <button type="button" className="signin-demo__fill" onClick={() => applyDemoAccount(row.email)}>
                    <LogIn size={16} aria-hidden />
                    Use
                  </button>
                </li>
              ))}
            </ul>
            <p className="signin-demo__prod-note">
              To hide this panel (e.g. live site with only invited users), set{' '}
              <code className="signin-demo__code">VITE_HIDE_DEMO_LOGIN=1</code> in your deployment environment.
            </p>
          </section>
        ) : null}

        {!isSupabaseConfigured ? (
          <p className="signin-card__warn">
            Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> (or legacy{' '}
            <code>VITE_SUPABASE_ANON_KEY</code>) in your environment — then reload.
            Until then, open the dashboard from the home page without credentials.
          </p>
        ) : null}
        <form className="signin-form" onSubmit={handleSubmit} noValidate>
          <label className="signin-label">
            Email
            <input
              className="signin-input"
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="signin-label">
            Password
            <input
              className="signin-input"
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {error ? (
            <p className="signin-form__error" role="alert">
              {error}
            </p>
          ) : null}
          <button className="signin-submit" type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="signin-submit__spin" size={18} aria-hidden />
                Signing in…
              </>
            ) : (
              'Continue'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
