import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'
import { DRIS_ROLES } from '../constants/roles'

const AuthContext = createContext(null)

async function fetchProfileRow(userId) {
  if (!supabase) return { profile: null, error: null }
  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, display_name, phone, job_title, locale, avatar_url, created_at, updated_at')
    .eq('id', userId)
    .maybeSingle()
  return { profile: data ?? null, error: error ? error.message || String(error) : null }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [profileError, setProfileError] = useState(null)
  const [loading, setLoading] = useState(true)

  const refreshProfile = useCallback(async () => {
    const uid = session?.user?.id
    if (!supabase || !uid) {
      setProfile(null)
      setProfileError(null)
      return { profile: null, error: null }
    }
    const { error: invRpcErr } = await supabase.rpc('apply_pending_invitation')
    if (invRpcErr && import.meta.env.DEV) {
      console.warn('[DRIS] apply_pending_invitation:', invRpcErr.message)
    }
    const { profile: next, error } = await fetchProfileRow(uid)
    setProfile(next)
    setProfileError(error)
    return { profile: next, error }
  }, [session?.user?.id])

  useEffect(() => {
    if (!supabase) {
      setSession(null)
      setProfile(null)
      setProfileError(null)
      setLoading(false)
      return undefined
    }

    let cancelled = false

    async function hydrateUser(userId) {
      const { error: invRpcErr } = await supabase.rpc('apply_pending_invitation')
      if (invRpcErr && import.meta.env.DEV) {
        console.warn('[DRIS] apply_pending_invitation:', invRpcErr.message)
      }
      const { profile: next, error } = await fetchProfileRow(userId)
      if (cancelled) return
      setProfile(next)
      setProfileError(error)
    }

    supabase.auth
      .getSession()
      .then(({ data: { session: s } }) => {
        if (cancelled) return
        setSession(s)
        if (s?.user?.id) {
          return hydrateUser(s.user.id).finally(() => {
            if (!cancelled) setLoading(false)
          })
        }
        setProfile(null)
        setProfileError(null)
        setLoading(false)
        return undefined
      })
      .catch(() => {
        if (!cancelled) {
          setSession(null)
          setProfile(null)
          setProfileError(null)
          setLoading(false)
        }
      })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next)
      if (!next?.user?.id) {
        setProfile(null)
        setProfileError(null)
        return
      }
      if (event === 'TOKEN_REFRESHED') {
        return
      }
      hydrateUser(next.user.id)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  const role = profile?.role ?? DRIS_ROLES.DATA_OFFICER

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      profileError,
      role,
      loading,
      isSupabaseConfigured,
      refreshProfile,
      signOut: async () => {
        if (!supabase) return { error: new Error('Supabase not configured') }
        return supabase.auth.signOut()
      },
      signInWithPassword: async (email, password) => {
        if (!supabase) return { data: null, error: new Error('Supabase not configured') }
        return supabase.auth.signInWithPassword({ email, password })
      },
    }),
    [session, profile, profileError, role, loading, refreshProfile]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
