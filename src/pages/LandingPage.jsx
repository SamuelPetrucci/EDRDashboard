import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BellRing,
  Brain,
  Cpu,
  Layers,
  Scale,
  Shield,
  Sparkles,
} from 'lucide-react'
import LandingGlobe from '../components/LandingGlobe'
import skillvantageLogo from '../../skillvantagelogo.png'
import { APP_BASE } from '../constants/paths'
import { useAuth } from '../context/AuthContext'
import './LandingPage.css'

export default function LandingPage() {
  const { session, isSupabaseConfigured } = useAuth()
  const canEnter = !isSupabaseConfigured || session

  return (
    <div className="landing">
      <div className="landing__bg" aria-hidden="true" />

      <main className="landing__main">
        <div className="landing__dock-wrap">
          <div className="landing__dock">
            <div className="landing__dock-brand">
              <img
                src={skillvantageLogo}
                alt="SkillVantage Enterprise"
                className="landing__dock-sv-logo"
                width={160}
                height={48}
                decoding="async"
              />
              <span className="landing__dock-mark-divider" aria-hidden="true" />
              <div className="landing__dock-titles">
                <span className="landing__dock-acronym">
                  DRIS<sup className="landing__tm">™</sup>
                </span>
                <span className="landing__dock-tagline">Disaster Resilience Intelligence Scorecard™</span>
              </div>
            </div>
            <nav className="landing__dock-nav" aria-label="Account">
              {canEnter ? (
                <Link className="landing__dock-link landing__dock-link--ghost" to={APP_BASE}>
                  Dashboard
                </Link>
              ) : null}
              <Link className="landing__dock-link landing__dock-link--primary" to="/sign-in">
                Sign in
              </Link>
            </nav>
          </div>
        </div>
        <section className="landing__hero">
          <div className="landing__copy">
            <p className="landing__eyebrow">
              Centralized intelligence · AI-assisted alerting · one operational truth
            </p>
            <h1 className="landing__headline">
              Resilience orchestration for a world{' '}
              <span className="landing__accent landing__accent--orange">that never slows down.</span>
            </h1>
            <p className="landing__lede">
              DRIS is built as a <strong className="landing__lede-strong">central intelligence system</strong>—a single
              spine where preparedness, live feeds, and scorecard signals converge. Instead of chasing updates across
              spreadsheets, chats, and siloed maps, teams work from one auditable picture with{' '}
              <strong className="landing__lede-strong">AI-assisted alerting</strong> to surface what is abnormal,
              urgent, or drifting—so leaders act earlier with less noise.
            </p>
            <div className="landing__cta-row">
              {canEnter ? (
                <Link className="landing__cta landing__cta--primary" to={APP_BASE}>
                  Open command center
                  <ArrowRight size={18} aria-hidden />
                </Link>
              ) : (
                <Link className="landing__cta landing__cta--primary" to="/sign-in">
                  Sign in to platform
                  <ArrowRight size={18} aria-hidden />
                </Link>
              )}
            </div>
            <ul className="landing__pillars" role="list">
              <li>
                <Brain size={20} aria-hidden />
                <span>
                  <strong className="landing__pillar-title">Central intelligence.</strong> One canonical view of
                  jurisdictions, assets, and readiness—so everyone debates the same facts, not conflicting exports.
                </span>
              </li>
              <li>
                <BellRing size={20} aria-hidden />
                <span>
                  <strong className="landing__pillar-title">AI alerting.</strong> Signals are prioritized and
                  contextualized—patterns, thresholds, and anomalies rise above the noise instead of burying duty
                  officers in raw pings.
                </span>
              </li>
              <li>
                <Shield size={20} aria-hidden />
                <span>
                  <strong className="landing__pillar-title">Governed access.</strong> Role-aware entry through
                  Supabase-backed auth—so intelligence stays centralized without losing control of who sees what.
                </span>
              </li>
            </ul>
          </div>
          <div className="landing__visual">
            <LandingGlobe />
            <p className="landing__visual-caption">Same live Mapbox 3D globe as Intel — satellite tiles, spin, zoom, and pan.</p>
          </div>
        </section>

        <section className="landing__intel" aria-labelledby="landing-intel-heading">
          <div className="landing__intel-inner">
            <h2 id="landing-intel-heading" className="landing__intel-heading">
              Why a <span className="landing__accent landing__accent--sky">central</span> intelligence system matters
            </h2>
            <p className="landing__intel-intro">
              Disasters punish fragmentation. When every department runs its own dashboards, inboxes, and ad hoc
              maps, latency creeps in: the same hazard gets interpreted three ways, escalations stall, and executives
              cannot prove which version of “the truth” drove a decision. DRIS exists to collapse that sprawl into a
              governed, shared operating layer—so response is faster, coordination is simpler, and after-action review
              is actually possible.
            </p>

            <div className="landing__intel-grid">
              <article className="landing__intel-card">
                <div className="landing__intel-card-icon" aria-hidden="true">
                  <Layers size={22} strokeWidth={2} />
                </div>
                <h3 className="landing__intel-card-title">One spine, not ten tools</h3>
                <p className="landing__intel-card-text">
                  Central intelligence means feeds, scorecards, and jurisdiction data meet in one place. That reduces
                  swivel-chair work, cuts duplicate data entry, and makes handoffs between national and parish teams
                  legible—because they are looking at the same object model and history.
                </p>
              </article>
              <article className="landing__intel-card">
                <div className="landing__intel-card-icon" aria-hidden="true">
                  <Sparkles size={22} strokeWidth={2} />
                </div>
                <h3 className="landing__intel-card-title">AI alerting that earns attention</h3>
                <p className="landing__intel-card-text">
                  Raw telemetry is never short on volume; it is short on meaning. AI-assisted alerting is how DRIS helps
                  you triage: correlate signals across sources, highlight sustained degradation versus one-off spikes,
                  and steer humans toward the next best action—verification, notification, or resource move—instead of
                  endless scrolling.
                </p>
              </article>
              <article className="landing__intel-card">
                <div className="landing__intel-card-icon" aria-hidden="true">
                  <Scale size={22} strokeWidth={2} />
                </div>
                <h3 className="landing__intel-card-title">Stakes: speed, equity, and trust</h3>
                <p className="landing__intel-card-text">
                  When intelligence is centralized and alert logic is transparent, communities get more consistent
                  outreach, donors and partners see defensible reporting, and internal audit has a trail. That is not
                  bureaucracy—it is the difference between guessing under pressure and operating with a shared,
                  explainable picture.
                </p>
              </article>
            </div>

            <div className="landing__intel-band">
              <div className="landing__intel-band-text">
                <p className="landing__intel-band-lead">
                  <Cpu size={20} className="landing__intel-band-icon" aria-hidden />
                  <span>
                    <strong>Use DRIS as the system of engagement for resilience intelligence</strong>—not as another
                    side channel. Push operational reality here first; let downstream tools consume what this spine
                    certifies.
                  </span>
                </p>
                <p className="landing__intel-band-sub">
                  Geospatial context and live awareness remain available in the command views when your data sources and
                  policies are connected—always subordinate to human judgment and your governance model.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing__footer">
        <small>© {new Date().getFullYear()} SkillVantage Enterprise. DRIS™ proprietary.</small>
      </footer>
    </div>
  )
}
