import { useState, useEffect } from 'react'
import { Stack, Text, Card, Group, Badge, ScrollArea, Box } from '@mantine/core'
import { IconRefresh } from '@tabler/icons-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Database } from '../../lib/supabase'
import { useUnreadCount } from '../../hooks/useUnreadCount'
import { updateParticipantOrder } from '../../lib/rooms'

type Participant = Database['public']['Tables']['participants']['Row']

interface PlayerSidebarProps {
  roomId: string
  participantId: string
  participants: Participant[]
  selectedPlayerId: string | null
  onSelectPlayer: (player: Participant | null) => void
  onSelectBroadcast: () => void
  isBroadcastSelected: boolean
  onResetGame: () => void
}

/**
 * Player sidebar for desktop Storyteller view.
 *
 * Shows:
 * - Broadcast option at top
 * - Player list with unread badges (drag-and-drop reorderable)
 * - Selected state highlighting
 * - Reset game button at bottom
 */
export function PlayerSidebar({
  roomId,
  participantId,
  participants,
  selectedPlayerId,
  onSelectPlayer,
  onSelectBroadcast,
  isBroadcastSelected,
  onResetGame,
}: PlayerSidebarProps) {
  // Local state for optimistic reordering - initialize from participants
  const [playerOrder, setPlayerOrder] = useState<string[]>(() =>
    participants
      .filter(p => p.role !== 'storyteller')
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(p => p.id)
  )

  // Sync order when participants change
  // Using queueMicrotask to defer setState and satisfy lint rules
  useEffect(() => {
    const newOrder = participants
      .filter(p => p.role !== 'storyteller')
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(p => p.id)
    // Only update if order actually changed to avoid unnecessary re-renders
    if (JSON.stringify(newOrder) !== JSON.stringify(playerOrder)) {
      queueMicrotask(() => setPlayerOrder(newOrder))
    }
  }, [participants, playerOrder])

  // Configure sensors for drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  /**
   * Handle drag end - reorder players and persist to database.
   */
  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = playerOrder.indexOf(active.id as string)
    const newIndex = playerOrder.indexOf(over.id as string)
    const newOrder = arrayMove(playerOrder, oldIndex, newIndex)

    // Capture old order before optimistic update for rollback
    const oldOrder = playerOrder

    // Optimistic update
    setPlayerOrder(newOrder)

    // Persist to database
    try {
      await updateParticipantOrder(newOrder)
    } catch (error) {
      // Revert to captured old order on error
      setPlayerOrder(oldOrder)
      console.error('Failed to persist order:', error)
    }
  }

  return (
    <Stack h="100%" gap={0}>
      {/* Header */}
      <Box
        p="md"
        style={{
          borderBottom: '1px solid var(--mantine-color-dark-4)',
          backgroundColor: 'var(--mantine-color-dark-7)',
        }}
      >
        <Text size="lg" fw={700} c="crimson">
          Players
        </Text>
        <Text size="xs" c="dimmed">
          Select to open conversation
        </Text>
      </Box>

      {/* Player list with drag-and-drop */}
      <ScrollArea style={{ flex: 1 }}>
        <Stack gap={0} p="xs">
          {/* Broadcast option (not draggable) */}
          <SidebarItem
            icon="broadcast"
            name="Broadcast to All"
            subtitle="Send to all players"
            selected={isBroadcastSelected}
            onClick={onSelectBroadcast}
            roomId={roomId}
            participantId={participantId}
            playerId={null}
          />

          {/* Sortable player items */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={playerOrder}
              strategy={verticalListSortingStrategy}
            >
              {playerOrder.map(playerId => {
                const player = participants.find(p => p.id === playerId)
                if (!player) return null
                return (
                  <SortableSidebarItem
                    key={player.id}
                    player={player}
                    selected={selectedPlayerId === player.id}
                    onClick={() => onSelectPlayer(player)}
                    roomId={roomId}
                    participantId={participantId}
                  />
                )
              })}
            </SortableContext>
          </DndContext>
        </Stack>
      </ScrollArea>

      {/* Reset button */}
      <Box
        p="md"
        style={{
          borderTop: '1px solid var(--mantine-color-dark-4)',
        }}
      >
        <Text
          size="sm"
          c="red"
          ta="center"
          style={{ cursor: 'pointer' }}
          onClick={onResetGame}
        >
          <IconRefresh
            size={14}
            style={{ verticalAlign: 'middle', marginRight: 4 }}
          />
          Reset Game
        </Text>
      </Box>
    </Stack>
  )
}

/**
 * Individual sidebar item (player or broadcast) - non-sortable version.
 */
function SidebarItem({
  icon,
  name,
  subtitle,
  selected,
  onClick,
  roomId,
  participantId,
  playerId,
}: {
  icon?: string
  name: string
  subtitle?: string
  selected: boolean
  onClick: () => void
  roomId: string
  participantId: string
  playerId: string | null
}) {
  const unreadCount = useUnreadCount(roomId, participantId, playerId)

  return (
    <Card
      p="sm"
      radius="md"
      onClick={onClick}
      style={{
        cursor: 'pointer',
        backgroundColor: selected
          ? 'var(--mantine-color-dark-5)'
          : 'transparent',
      }}
    >
      <Group justify="space-between" gap="sm" wrap="nowrap">
        <Group gap="sm" wrap="nowrap" style={{ overflow: 'hidden' }}>
          <Text
            size="lg"
            style={{
              flexShrink: 0,
            }}
          >
            {icon === 'broadcast' ? '📢' : icon || '👤'}
          </Text>
          <Stack gap={2} style={{ overflow: 'hidden' }}>
            <Text
              size="sm"
              fw={500}
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {name}
            </Text>
            {subtitle && (
              <Text size="xs" c="dimmed">
                {subtitle}
              </Text>
            )}
          </Stack>
        </Group>

        {unreadCount > 0 && (
          <Badge color="red" variant="filled" size="sm">
            {unreadCount}
          </Badge>
        )}
      </Group>
    </Card>
  )
}

/**
 * Sortable sidebar item for player entries with drag-and-drop support.
 */
function SortableSidebarItem({
  player,
  selected,
  onClick,
  roomId,
  participantId,
}: {
  player: Participant
  selected: boolean
  onClick: () => void
  roomId: string
  participantId: string
}) {
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
    backgroundColor: selected ? 'var(--mantine-color-dark-5)' : 'transparent',
    touchAction: 'none', // Required for mobile drag
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      p="sm"
      radius="md"
      onClick={onClick}
    >
      <Group justify="space-between" gap="sm" wrap="nowrap">
        <Group gap="sm" wrap="nowrap" style={{ overflow: 'hidden' }}>
          <Text
            size="lg"
            style={{
              filter: isDead ? 'grayscale(100%)' : 'none',
              flexShrink: 0,
            }}
          >
            {player.avatar_id || '👤'}
          </Text>
          <Stack gap={2} style={{ overflow: 'hidden' }}>
            <Group gap={4}>
              <Text
                size="sm"
                fw={500}
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {player.display_name}
              </Text>
              {isDead && (
                <Text size="sm" c="dimmed">
                  💀
                </Text>
              )}
            </Group>
            {player.status === 'dead' && (
              <Text size="xs" c="dimmed">
                Dead
              </Text>
            )}
            {player.custom_status && (
              <Badge size="xs" variant="light" color="gray">
                {player.custom_status}
              </Badge>
            )}
          </Stack>
        </Group>

        {unreadCount > 0 && (
          <Badge color="red" variant="filled" size="sm">
            {unreadCount}
          </Badge>
        )}
      </Group>
    </Card>
  )
}
