import { Stack, Group, Text, Badge, ActionIcon } from '@mantine/core'
import { IconEdit, IconX } from '@tabler/icons-react'
import type { Database } from '../lib/supabase'

type Participant = Database['public']['Tables']['participants']['Row']

interface ParticipantListProps {
  participants: Participant[]
  currentUserId: string
  showRole?: boolean
  onKick?: (participantId: string) => void
  onEdit?: (participantId: string, currentName: string) => void
  isStoryteller?: boolean
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
 * @param onKick - Callback when Storyteller kicks a participant (optional)
 * @param onEdit - Callback when Storyteller edits a participant's name (optional)
 * @param isStoryteller - Whether current user is Storyteller (enables action buttons)
 */
export function ParticipantList({
  participants,
  currentUserId,
  showRole = true,
  onKick,
  onEdit,
  isStoryteller = false,
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
        const showActions = isStoryteller && !isCurrentUser

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
            justify="space-between"
          >
            {/* Left side: Avatar and name */}
            <Group gap="sm">
              {/* Avatar emoji */}
              {participant.avatar_id && (
                <Text size="xl" style={{ fontSize: '24px' }}>
                  {participant.avatar_id}
                </Text>
              )}

              {/* Display name */}
              <Text>{participant.display_name}</Text>
            </Group>

            {/* Right side: Role badge and action buttons */}
            <Group gap="xs">
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

              {/* Action buttons (Storyteller only, not for self) */}
              {showActions && (
                <Group gap="xs">
                  {/* Edit button */}
                  {onEdit && (
                    <ActionIcon
                      size="sm"
                      variant="subtle"
                      onClick={() => onEdit(participant.id, participant.display_name)}
                      aria-label={`Edit ${participant.display_name}`}
                    >
                      <IconEdit size={16} />
                    </ActionIcon>
                  )}

                  {/* Kick button */}
                  {onKick && (
                    <ActionIcon
                      size="sm"
                      variant="subtle"
                      color="red"
                      onClick={() => onKick(participant.id)}
                      aria-label={`Kick ${participant.display_name}`}
                    >
                      <IconX size={16} />
                    </ActionIcon>
                  )}
                </Group>
              )}
            </Group>
          </Group>
        )
      })}
    </Stack>
  )
}
