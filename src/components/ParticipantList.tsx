import { Stack, Group, Text, Badge } from '@mantine/core'
import type { Database } from '../lib/supabase'

type Participant = Database['public']['Tables']['participants']['Row']

interface ParticipantListProps {
  participants: Participant[]
  currentUserId: string
  showRole?: boolean
}

/**
 * Participant list component with real-time updates.
 *
 * Displays avatars, names, and role badges for all participants in a room.
 * Highlights the current user with a subtle background.
 *
 * Gothic theme: dark background, crimson accents for Storyteller role.
 * Mobile-first design with accessible semantic HTML.
 *
 * @param participants - Array of participants to display (pre-sorted by sort_order)
 * @param currentUserId - User ID to highlight
 * @param showRole - Whether to show role badges (default: true)
 */
export function ParticipantList({
  participants,
  currentUserId,
  showRole = true,
}: ParticipantListProps) {
  if (participants.length === 0) {
    return (
      <Text size="sm" c="dimmed" ta="center">
        Waiting for players to join...
      </Text>
    )
  }

  return (
    <Stack gap="sm" role="list">
      {participants.map((participant) => {
        const isCurrentUser = participant.user_id === currentUserId
        const roleLabel =
          participant.role === 'storyteller' ? 'Storyteller' : 'Player'

        return (
          <Group
            key={participant.id}
            gap="sm"
            p="xs"
            style={{
              borderRadius: 'var(--mantine-radius-sm)',
              backgroundColor: isCurrentUser
                ? 'var(--mantine-color-dark-6)'
                : 'transparent',
            }}
            role="listitem"
            aria-label={`${participant.avatar_id || ''} ${participant.display_name} - ${roleLabel}`}
          >
            {/* Avatar emoji */}
            {participant.avatar_id && (
              <Text size="xl" style={{ fontSize: '24px' }}>
                {participant.avatar_id}
              </Text>
            )}

            {/* Display name */}
            <Text flex={1}>{participant.display_name}</Text>

            {/* Role badge */}
            {showRole && (
              <Badge
                color={participant.role === 'storyteller' ? 'crimson' : 'gray'}
                variant={participant.role === 'storyteller' ? 'filled' : 'light'}
                size="sm"
              >
                {roleLabel}
              </Badge>
            )}
          </Group>
        )
      })}
    </Stack>
  )
}
