import { useEffect, useMemo, useState } from 'react'
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'
import { useRegion, REGION_JAMAICA, REGION_USA } from '../context/RegionContext'
import { useAuth } from '../context/AuthContext'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'
import { fetchLatestNationalScorecard, fetchLatestSubnationalScoresByJurisdictionCode } from '../lib/scorecardHeatmapData'
import { parishCoordinates, jamaicaCenter } from '../data/parishCoordinates'
import { usStateCoordinates } from '../data/usStates'
import JurisdictionScoreHeatmap from '../components/JurisdictionScoreHeatmap'
import { JAMAICA_PARISH_BOUNDARY_GEOJSON } from '../data/geo/jmParishBoundaryGeo'
import '../styles/dris-dashboard.css'
import './ExecutiveDashboard.css'

const RADAR_FALLBACK = [
  { label: 'Governance', v: 82 },
  { label: 'Infrastructure', v: 74 },
  { label: 'Housing', v: 69 },
  { label: 'Health', v: 77 },
  { label: 'Economy', v: 71 },
  { label: 'Finance', v: 68 },
  { label: 'Community', v: 79 },
]

const USA_MAP_CENTER = { lat: 39.5, lng: -98.35 }

const ACTIONS = [
  'Strengthen recovery planning and cross-agency coordination.',
  'Close housing recovery gaps in eastern parishes.',
  'Accelerate resilient infrastructure inspections.',
  'Publish transparent recovery finance dashboards.',
  'Expand community engagement in high-vulnerability zones.',
]

function hashScore(id) {
  let h = 0
  const s = String(id)
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return 52 + (h % 33)
}

function bandForScore(score) {
  if (score >= 85) return { label: 'Resilient', className: 'dris-pill dris-pill--ok' }
  if (score >= 70) return { label: 'Thriving', className: 'dris-pill dris-pill--ok' }
  if (score >= 50) return { label: 'Needs support', className: 'dris-pill dris-pill--warn' }
  return { label: 'Not yet started', className: 'dris-pill dris-pill--bad' }
}

/** Map stored classification text to pill styling when present on scorecard_snapshots */
function bandFromClassification(classification, scoreFallback) {
  if (!classification || typeof classification !== 'string') return bandForScore(scoreFallback)
  const t = classification.trim()
  const lower = t.toLowerCase()
  if (lower.includes('resilient')) return { label: t, className: 'dris-pill dris-pill--ok' }
  if (lower.includes('thriv')) return { label: t, className: 'dris-pill dris-pill--ok' }
  if (lower.includes('risk') || lower.includes('support') || lower.includes('need')) {
    return { label: t, className: 'dris-pill dris-pill--warn' }
  }
  if (lower.includes('not') || lower.includes('start')) return { label: t, className: 'dris-pill dris-pill--bad' }
  return { label: t, className: 'dris-pill dris-pill--ok' }
}

function radarFromDomainScores(domainScores, fallback) {
  if (!domainScores || typeof domainScores !== 'object') return fallback
  let matched = false
  const next = fallback.map(({ label, v }) => {
    const keys = [label, label.toLowerCase(), label.replace(/\s+/g, '_').toLowerCase()]
    let raw
    for (const k of keys) {
      if (domainScores[k] != null) {
        raw = domainScores[k]
        break
      }
    }
    const num = raw != null ? Number(raw) : NaN
    if (Number.isFinite(num)) matched = true
    return { label, v: Number.isFinite(num) ? num : v }
  })
  return matched ? next : fallback
}

export default function ExecutiveDashboard() {
  const { catalog, region } = useRegion()
  const { session } = useAuth()
  const regionName = region === REGION_USA ? 'United States' : 'Jamaica'
  const jp = catalog?.jurisdictionLabelSingular || 'Parish'
  const countrySlug = region === REGION_USA ? 'united-states' : 'jamaica'

  const [subnationalByCode, setSubnationalByCode] = useState(() => new Map())
  const [nationalSnapshot, setNationalSnapshot] = useState(null)
  const [scorecardLoadState, setScorecardLoadState] = useState('idle')

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!isSupabaseConfigured || !supabase || !session) {
        setSubnationalByCode(new Map())
        setNationalSnapshot(null)
        setScorecardLoadState('skipped')
        return
      }
      setScorecardLoadState('loading')
      try {
        const [byCode, national] = await Promise.all([
          fetchLatestSubnationalScoresByJurisdictionCode(supabase, countrySlug),
          fetchLatestNationalScorecard(supabase, countrySlug),
        ])
        if (!cancelled) {
          setSubnationalByCode(byCode)
          setNationalSnapshot(national)
          setScorecardLoadState('ok')
        }
      } catch {
        if (!cancelled) {
          setSubnationalByCode(new Map())
          setNationalSnapshot(null)
          setScorecardLoadState('error')
        }
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [session, countrySlug])

  const hasLiveSubnational = subnationalByCode.size > 0

  const rows = useMemo(() => {
    const list = catalog?.getAllJurisdictions?.() ?? []
    return list
      .map((p) => {
        const live = subnationalByCode.get(p.id)
        const scoreFromDb = live?.score
        const score = scoreFromDb != null && Number.isFinite(scoreFromDb) ? scoreFromDb : hashScore(p.id)
        const band =
          live?.classification != null && live.classification !== ''
            ? bandFromClassification(live.classification, score)
            : bandForScore(score)
        const scoreSource = scoreFromDb != null && Number.isFinite(scoreFromDb) ? 'scorecard' : 'demo'
        return { ...p, score, band, scoreSource, scoreAsOf: live?.as_of_date ?? null }
      })
      .sort((a, b) => b.score - a.score)
  }, [catalog, subnationalByCode])

  const overall = nationalSnapshot?.score != null && Number.isFinite(nationalSnapshot.score) ? nationalSnapshot.score : 72
  const overallBand =
    nationalSnapshot?.classification != null && nationalSnapshot.classification !== ''
      ? bandFromClassification(nationalSnapshot.classification, overall)
      : bandForScore(overall)

  const radarData = useMemo(
    () => radarFromDomainScores(nationalSnapshot?.domain_scores, RADAR_FALLBACK),
    [nationalSnapshot?.domain_scores]
  )

  const compositeFootnote =
    nationalSnapshot?.score != null && nationalSnapshot.as_of_date
      ? `National composite from scorecard (${nationalSnapshot.as_of_date}).`
      : hasLiveSubnational
        ? `${jp} scores from latest scorecard snapshots; national row uses demo until a national snapshot exists.`
        : 'Demo values — add rows to scorecard_snapshots in Supabase to drive this view.'

  const heatCoords = region === REGION_USA ? usStateCoordinates : parishCoordinates
  const heatCenter = region === REGION_USA ? USA_MAP_CENTER : jamaicaCenter
  const heatAria =
    region === REGION_USA ? 'US state DRIS score heat map' : 'Jamaica parish DRIS score heat map'

  return (
    <div className="dris-dashboard">
      <h1 className="dris-dashboard__page-title">Country executive dashboard</h1>

      <div className="dris-dashboard__toolbar">
        <input type="search" className="dris-dashboard__search" placeholder="Search jurisdictions, KPIs, reports…" aria-label="Search" />
        <span className="dris-dashboard__chip">{regionName}</span>
      </div>

      <div className="dris-dashboard__grid dris-dashboard__grid--kpi4" style={{ marginBottom: '1rem' }}>
        <div className="dris-card">
          <h2 className="dris-card__title">Overall DRIS score</h2>
          <div className="dris-card__body dris-gauge-simple">
            <div>
              <span className="dris-gauge-simple__n">{overall}</span>
              <span className="dris-gauge-simple__slash">/100</span>
            </div>
            <div className="dris-gauge-bar" aria-hidden>
              <span style={{ width: `${Math.min(100, overall)}%` }} />
            </div>
            <p className="dris-muted" style={{ marginTop: '0.5rem' }}>
              {compositeFootnote}
            </p>
            {scorecardLoadState === 'loading' ? (
              <p className="dris-muted" style={{ marginTop: '0.35rem', fontSize: '0.78rem' }}>
                Loading scorecard…
              </p>
            ) : null}
          </div>
        </div>

        <div className="dris-card">
          <h2 className="dris-card__title">Classification</h2>
          <div className="dris-card__body">
            <span className={overallBand.className}>{overallBand.label}</span>
            <p className="dris-muted" style={{ marginTop: '0.75rem' }}>
              Band for scores 70–84: <strong className="dris-text-strong">Thriving</strong>
            </p>
          </div>
        </div>

        <div className="dris-card">
          <h2 className="dris-card__title">Critical KPI flags</h2>
          <div className="dris-card__body">
            <p className="dris-stat-num dris-stat-num--alert">3</p>
            <p className="dris-muted">Critical KPIs require attention (demo).</p>
          </div>
        </div>

        <div className="dris-card">
          <h2 className="dris-card__title">Top 5 immediate actions</h2>
          <div className="dris-card__body">
            <ol className="dris-actions">
              {ACTIONS.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      <div className="dris-dashboard__grid dris-dashboard__grid--triple">
        <div className="dris-card">
          <h2 className="dris-card__title">{jp} performance</h2>
          <div className="dris-card__body">
            <JurisdictionScoreHeatmap
              rows={rows}
              coordinates={heatCoords}
              fallbackCenter={heatCenter}
              ariaLabel={heatAria}
              radiusForId={region === REGION_USA ? () => 220000 : undefined}
              boundaryGeoJson={region === REGION_JAMAICA ? JAMAICA_PARISH_BOUNDARY_GEOJSON : null}
            />
            <table className="dris-table">
              <thead>
                <tr>
                  <th>{jp}</th>
                  <th>Score</th>
                  <th>Classification</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 10).map((r) => (
                  <tr key={r.id}>
                    <td>{r.name || r.id}</td>
                    <td>
                      {r.score}
                      {r.scoreSource === 'scorecard' ? (
                        <span className="dris-muted" style={{ fontSize: '0.68rem', marginLeft: '0.35rem' }}>
                          · scorecard
                        </span>
                      ) : null}
                    </td>
                    <td>
                      <span className={r.band.className} style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}>
                        {r.band.label}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="dris-card">
          <h2 className="dris-card__title">Domain performance</h2>
          <div className="dris-card__body dris-radar-host">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="52%" outerRadius="78%" data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 10 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Score" dataKey="v" stroke="#059669" fill="#10b981" fillOpacity={0.35} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="dris-card">
          <h2 className="dris-card__title">AI insights</h2>
          <div className="dris-card__body">
            <p className="dris-card__title" style={{ margin: '0 0 0.35rem', textTransform: 'none', letterSpacing: '0' }}>
              Key barriers
            </p>
            <ul className="dris-muted" style={{ margin: '0 0 1rem 1rem' }}>
              <li>Financing gaps for long-term housing recovery.</li>
              <li>Uneven evidence quality across {jp.toLowerCase()} submissions.</li>
            </ul>
            <p className="dris-card__title" style={{ margin: '0 0 0.35rem', textTransform: 'none', letterSpacing: '0' }}>
              Recommended partners
            </p>
            <p className="dris-muted">World Bank, IDB, UNDP, CDEMA, local finance ministry.</p>
            <p className="dris-card__title" style={{ margin: '1rem 0 0.35rem', textTransform: 'none', letterSpacing: '0' }}>
              Strategic actions
            </p>
            <p className="dris-muted">Prioritize calibration review for housing and finance domains this quarter.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
