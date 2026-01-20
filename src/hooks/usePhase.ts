import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { getNextPhase } from '../lib/phase-helpers'
import { notifications } from '@mantine/notifications'

interface UsePhaseReturn {
  phase: string
  loading: boolean
  advancePhase: () => Promise<void>
}

/**
 * Real-time phase tracking hook.
 *
 * Subscribes to phase changes using Supabase Postgres Changes.
 * Provides current phase state and advancePhase helper for Storyteller.
 *
 * Pattern matches useParticipants hook:
 * - useState for phase and loading
 * - useEffect for fetch + subscription
 * - Cleanup on unmount
 *
 * @param roomId - Room ID to track phase for
 * @returns {UsePhaseReturn} Phase state, loading state, and advance function
 */
export function usePhase(roomId: string): UsePhaseReturn {
  const [phase, setPhase] = useState<string>('Night 1')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch initial phase
    const fetchPhase = async () => {
      const { data, error } = await supabase
        .from('rooms')
        .select('phase')
        .eq('id', roomId)
        .single()

      if (error) {
        console.error('Error fetching phase:', error)
        setLoading(false)
        return
      }

      if (data?.phase) {
        setPhase(data.phase)
      }
      setLoading(false)
    }

    fetchPhase()

    // Subscribe to real-time phase changes
    const channel = supabase
      .channel(`room:${roomId}:phase`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rooms',
          filter: `id=eq.${roomId}`,
        },
        payload => {
          // Update local state when phase column changes
          if (payload.new.phase && payload.new.phase !== phase) {
            setPhase(payload.new.phase as string)
          }
        }
      )
      .subscribe()

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId, phase])

  /**
   * Advance the game to the next phase.
   *
   * Computes next phase using getNextPhase helper and updates database.
   * Shows error notification on failure.
   */
  const advancePhase = async (): Promise<void> => {
    try {
      const nextPhase = getNextPhase(phase)

      const { error } = await supabase
        .from('rooms')
        .update({ phase: nextPhase })
        .eq('id', roomId)

      if (error) {
        throw error
      }

      // Local state will be updated via postgres_changes subscription
    } catch (error) {
      console.error('Error advancing phase:', error)
      notifications.show({
        title: 'Error',
        message: 'Failed to advance phase. Please try again.',
        color: 'red',
      })
    }
  }

  return { phase, loading, advancePhase }
}
