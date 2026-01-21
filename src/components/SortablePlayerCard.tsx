import { Card, Text, Group, Badge, Stack } from '@mantine/core'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Database } from '../lib/supabase'
import { useUnreadCount } from '../hooks/useUnreadCount'
import styles from './StorytellerDashboard.module.css'

type Participant = Database['public']['Tables']['participants']['Row']

interface SortablePlayerCardProps {
  roomId: string
  participantId: string
  player: Participant
  onClick: () => void
}

/**
 * Draggable player card for Storyteller dashboard.
 *
 * Uses dnd-kit useSortable hook for drag-and-drop support.
 * Implements DASH-05: Storyteller can drag-and-drop to reorder player cards.
 *
 * Features:
 * - Drag handle on entire card
 * - Visual feedback during drag (opacity, cursor)
 * - Dead player styling (greyscale, reduced opacity)
 * - Unread message badge
 * - Custom status badge
 */
export function SortablePlayerCard({
  roomId,
  participantId,
  player,
  onClick,
}: SortablePlayerCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: player.id })

  const unreadCount = useUnreadCount(roomId, participantId, player.id)
  const isDead = player.status === 'dead'

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: isDragging ? 'grabbing' : 'grab',
    opacity: isDragging ? 0.8 : isDead ? 0.7 : 1,
    touchAction: 'none', // Required for mobile drag
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      shadow="sm"
      padding="lg"
      radius="md"
      withBorder
      className={!isDragging ? styles.hoverCard : undefined}
      onClick={onClick}
    >
      <Group justify="space-between" mb="xs">
        <Group gap="sm">
          {/* Avatar with greyscale for dead players */}
          {player.avatar_id && (
            <Text
              size="xl"
              style={{
                filter: isDead ? 'grayscale(100%)' : 'none',
              }}
            >
              {player.avatar_id}
            </Text>
          )}

          {/* Name, Role, and Custom Status */}
          <Stack gap={4}>
            <Group gap="xs">
              <Text fw={500}>{player.display_name}</Text>
              {isDead && <Text c="dimmed">💀</Text>}
            </Group>
            <Text size="xs" c="dimmed">
              Player
            </Text>
            {/* Custom status badge */}
            {player.custom_status && (
              <Badge size="xs" variant="light" color="gray">
                {player.custom_status}
              </Badge>
            )}
          </Stack>
        </Group>

        {/* Unread count badge */}
        {unreadCount > 0 && (
          <Badge color="red" variant="filled" size="lg">
            {unreadCount}
          </Badge>
        )}
      </Group>
    </Card>
  )
}
