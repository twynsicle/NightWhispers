import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { notifications } from '@mantine/notifications'
import { supabase } from '../../../lib/supabase'

/**
 * Hook for real-time detection of being kicked from a room.
 *
 * Subscribes to participant updates for the current user and navigates
 * to home with an error message if the participant is marked as inactive.
 *
 * This hook is used in RoomLayout to protect both LobbyPage and GamePage.
 *
 * @param participantId - The current user's participant ID
 */
export function useKickDetection(participantId: string): void {
  const navigate = useNavigate()

  useEffect(() => {
    const channel = supabase
      .channel(`participant:${participantId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'participants',
          filter: `id=eq.${participantId}`,
        },
        payload => {
          if (payload.new.is_active === false) {
            // User was kicked
            notifications.show({
              title: 'Removed from Room',
              message: 'You were removed from the room by the Storyteller.',
              color: 'red',
            })
            navigate('/?error=kicked')
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [participantId, navigate])
}
