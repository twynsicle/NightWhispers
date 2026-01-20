import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

/**
 * Authentication hook with session recovery and state management.
 *
 * Implements session persistence via localStorage (Supabase default) and
 * automatic token refresh. Prevents duplicate anonymous users via session
 * check before sign-in.
 *
 * @returns {Object} Auth state
 * @returns {Session | null} session - Current session or null if unauthenticated
 * @returns {boolean} loading - True during initial session recovery
 * @returns {Function} signInAnonymously - Creates anonymous session if none exists
 */
export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    // 1. Check for existing session from localStorage
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (isMounted) {
        setSession(session)
        setLoading(false)
      }
    })

    // 2. Listen for auth changes (sign in, sign out, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setSession(session)
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  /**
   * Sign in anonymously. Creates new user only if no session exists.
   *
   * IMPORTANT: Always checks for existing session first to prevent
   * duplicate user creation (Pitfall 2 from RESEARCH.md).
   *
   * @returns {Promise<Session>} The session (existing or newly created)
   * @throws {Error} If sign-in fails
   */
  async function signInAnonymously(): Promise<Session> {
    // Check if already signed in
    const { data: { session: existingSession } } = await supabase.auth.getSession()
    if (existingSession) {
      return existingSession
    }

    // Create new anonymous user
    const { data, error } = await supabase.auth.signInAnonymously()
    if (error) throw error
    if (!data.session) throw new Error('No session returned from signInAnonymously')

    return data.session
  }

  return { session, loading, signInAnonymously }
}
