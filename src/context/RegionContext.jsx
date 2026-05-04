import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  getRegionCatalog,
  normalizeRegion,
  REGION_JAMAICA,
  REGION_USA,
} from '../data/regionCatalog'

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

export function RegionProvider({ children }) {
  const [region, setRegionState] = useState(readStoredRegion)
  const navigate = useNavigate()
  const location = useLocation()

  const catalog = useMemo(() => getRegionCatalog(region), [region])

  const setRegion = useCallback(
    (next) => {
      const n = normalizeRegion(next)
      setRegionState(n)
      try {
        window.localStorage.setItem(STORAGE_KEY, n)
      } catch {
        /* ignore */
      }

      /** Jamaican parish routes use ids that don't exist under USA (and vice versa) — reset to overview */
      const onParishScoped =
        /^\/parish\/[^/]+/.test(location.pathname) ||
        location.pathname.includes('/contacts')
      if (onParishScoped) {
        navigate('/')
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
    }),
    [catalog, region, setRegion]
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
