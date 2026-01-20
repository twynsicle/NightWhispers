import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Database } from '../lib/supabase'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

type Participant = Database['public']['Tables']['participants']['Row']

interface UseParticipantsReturn {
  participants: Participant[]
  loading: boolean
}

/**
 * Real-time participant list hook.
 *
 * Subscribes to participant changes using Supabase Postgres Changes.
 * Uses Postgres Changes (not Broadcast) for state synchronization to guarantee
 * consistency with database state (per RESEARCH.md).
 *
 * @param roomId - Room ID to fetch participants for
 * @returns {UseParticipantsReturn} Participants array and loading state
 */
export function useParticipants(roomId: string): UseParticipantsReturn {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch initial participants
    const fetchParticipants = async () => {
      const { data, error } = await supabase
        .from('participants')
        .select('*')
        .eq('room_id', roomId)
        .eq('is_active', true)
        .order('sort_order')

      if (error) {
        console.error('Error fetching participants:', error)
        setLoading(false)
        return
      }

      setParticipants(data || [])
      setLoading(false)
    }

    fetchParticipants()

    // Subscribe to real-time changes
    const channel = supabase
      .channel(`room:${roomId}:participants`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'participants',
          filter: `room_id=eq.${roomId}`,
        },
        (payload: RealtimePostgresChangesPayload<Participant>) => {
          if (payload.eventType === 'INSERT') {
            // Add new participant if active
            const newParticipant = payload.new as Participant
            if (newParticipant.is_active) {
              setParticipants((prev) => {
                // Prevent duplicates
                if (prev.some((p) => p.id === newParticipant.id)) {
                  return prev
                }
                return [...prev, newParticipant].sort(
                  (a, b) => a.sort_order - b.sort_order
                )
              })
            }
          } else if (payload.eventType === 'UPDATE') {
            // Update existing participant or remove if inactive
            const updatedParticipant = payload.new as Participant
            setParticipants((prev) => {
              if (!updatedParticipant.is_active) {
                // Remove inactive participant (kicked or left)
                return prev.filter((p) => p.id !== updatedParticipant.id)
              }
              // Update participant
              return prev
                .map((p) => (p.id === updatedParticipant.id ? updatedParticipant : p))
                .sort((a, b) => a.sort_order - b.sort_order)
            })
          } else if (payload.eventType === 'DELETE') {
            // Remove deleted participant
            const deletedParticipant = payload.old as Participant
            setParticipants((prev) =>
              prev.filter((p) => p.id !== deletedParticipant.id)
            )
          }
        }
      )
      .subscribe()

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId])

  return { participants, loading }
}
