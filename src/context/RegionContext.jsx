import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  getRegionCatalog,
  JAMAICA_DATASET_ONLY,
  normalizeRegion,
  REGION_JAMAICA,
  REGION_USA,
} from '../data/regionCatalog'
import { getOperationsMapPath } from '../constants/roles'
import { useAuth } from './AuthContext'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'

const STORAGE_KEY = 'dris_dataset_region'

const RegionContext = createContext(null)

function readStoredRegion() {
  if (typeof window === 'undefined') return REGION_JAMAICA
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return normalizeRegion(raw)
  } catch {
    return REGION_JAMAICA
  }
}

/** @param {string} slug */
function slugToDatasetRegion(slug) {
  if (slug === 'united-states') return REGION_USA
  if (slug === 'jamaica') return REGION_JAMAICA
  return null
}

export function RegionProvider({ children }) {
  const { user, profile, loading: authLoading } = useAuth()
  const [region, setRegionState] = useState(() =>
    JAMAICA_DATASET_ONLY ? REGION_JAMAICA : readStoredRegion()
  )
  const [allowedRegions, setAllowedRegions] = useState(() => /** @type {Set<string>|null} */ (null))
  const allowedRegionsRef = useRef(/** @type {Set<string>|null} */ (null))
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    allowedRegionsRef.current = allowedRegions
  }, [allowedRegions])

  // Jamaica-only release: ignore stored USA preference and persist Jamaica.
  useEffect(() => {
    if (!JAMAICA_DATASET_ONLY || typeof window === 'undefined') return
    try {
      window.localStorage.setItem(STORAGE_KEY, REGION_JAMAICA)
    } catch {
      /* ignore */
    }
    setRegionState(REGION_JAMAICA)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadAccess() {
      if (!isSupabaseConfigured || !supabase || !user?.id || authLoading) {
        if (!cancelled) setAllowedRegions(null)
        return
      }

      const r = profile?.role
      if (r === 'platform_admin') {
        if (!cancelled) setAllowedRegions(null)
        return
      }

      const [uca, uja] = await Promise.all([
        supabase.from('user_country_access').select('country_id, countries (slug)').eq('user_id', user.id),
        supabase
          .from('user_jurisdiction_access')
          .select('jurisdiction_id, jurisdictions (code, countries (slug))')
          .eq('user_id', user.id),
      ])

      if (cancelled) return

      if (uca.error || uja.error) {
        setAllowedRegions(null)
        return
      }

      const next = new Set()
      for (const row of uca.data ?? []) {
        const slug = row.countries?.slug
        const mapped = slugToDatasetRegion(slug)
        if (mapped) next.add(mapped)
      }
      for (const row of uja.data ?? []) {
        const slug = row.jurisdictions?.countries?.slug
        const mapped = slugToDatasetRegion(slug)
        if (mapped) next.add(mapped)
      }

      if (next.size === 0) {
        setAllowedRegions(null)
        return
      }

      setAllowedRegions(next)
    }

    loadAccess()
    return () => {
      cancelled = true
    }
  }, [user?.id, profile?.role, authLoading])

  useEffect(() => {
    if (!allowedRegions || allowedRegions.size === 0) return
    if (!allowedRegions.has(region)) {
      const first = allowedRegions.values().next().value
      if (first) {
        setRegionState(first)
        try {
          window.localStorage.setItem(STORAGE_KEY, first)
        } catch {
          /* ignore */
        }
      }
    }
  }, [allowedRegions, region])

  const catalog = useMemo(() => getRegionCatalog(region), [region])

  const setRegion = useCallback(
    (next) => {
      if (JAMAICA_DATASET_ONLY) {
        const n = normalizeRegion(next)
        if (n === REGION_USA) return
      }

      const ar = allowedRegionsRef.current
      const n = normalizeRegion(next)
      if (ar && ar.size > 0 && !ar.has(n)) return

      setRegionState(n)
      try {
        window.localStorage.setItem(STORAGE_KEY, n)
      } catch {
        /* ignore */
      }

      /** Jamaican parish routes use ids that don't exist under USA (and vice versa) — reset to overview */
      const onParishScoped =
        /\/parish\/[^/]+/.test(location.pathname) || location.pathname.includes('/contacts')
      if (onParishScoped) {
        navigate(getOperationsMapPath())
      }
    },
    [location.pathname, navigate]
  )

  const value = useMemo(
    () => ({
      region,
      setRegion,
      catalog,
      isUsaMode: region === REGION_USA,
      allowedRegions,
    }),
    [allowedRegions, catalog, region, setRegion]
  )

  return <RegionContext.Provider value={value}>{children}</RegionContext.Provider>
}

export function useRegion() {
  const ctx = useContext(RegionContext)
  if (!ctx) {
    throw new Error('useRegion must be used within RegionProvider')
  }
  return ctx
}

export function useOptionalRegion() {
  return useContext(RegionContext)
}

export { REGION_JAMAICA, REGION_USA }
