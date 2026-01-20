import { useState, useEffect } from 'react'
import {
  SimpleGrid,
  Card,
  Text,
  Group,
  Badge,
  Stack,
  Button,
  Divider,
} from '@mantine/core'
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
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import type { Database } from '../lib/supabase'
import { ConversationView } from './ConversationView'
import { useUnreadCount, markConversationRead } from '../hooks/useUnreadCount'
import { GameResetModal } from './GameResetModal'
import { useDesktopLayout } from '../hooks/useDesktopLayout'
import { SplitPanelLayout } from './desktop/SplitPanelLayout'
import { PlayerSidebar } from './desktop/PlayerSidebar'
import { DesktopConversationPanel } from './desktop/DesktopConversationPanel'
import { SortablePlayerCard } from './SortablePlayerCard'
import { updateParticipantOrder } from '../lib/rooms'
import styles from './StorytellerDashboard.module.css'

type Participant = Database['public']['Tables']['participants']['Row']

interface StorytellerDashboardProps {
  roomId: string
  participantId: string
  participants: Participant[]
}

/**
 * Storyteller dashboard with player cards.
 *
 * Displays all players as tappable cards. Tapping a card opens a conversation view.
 * Includes a "Broadcast to All" card for sending messages to all players.
 *
 * Implements:
 * - DASH-01: Storyteller sees all players as cards on mobile
 * - DASH-03: Storyteller can open full chat view with player
 * - DASH-04: Desktop shows split-panel (player list + chat)
 * - MSG-04: Storyteller can broadcast message to all players
 * - UX-03: Desktop breakpoint (>1024px) shows optimized layout
 *
 * @param roomId - Room ID
 * @param participantId - Storyteller's participant ID
 * @param participants - Array of all participants in room
 */
export function StorytellerDashboard({
  roomId,
  participantId,
  participants,
}: StorytellerDashboardProps) {
  const { isDesktop } = useDesktopLayout()
  const [selectedParticipant, setSelectedParticipant] =
    useState<Participant | null>(null)
  const [isBroadcastMode, setIsBroadcastMode] = useState(false)
  const [resetModalOpened, setResetModalOpened] = useState(false)

  // Local state for optimistic reordering
  const [playerOrder, setPlayerOrder] = useState<string[]>([])

  // Initialize order from participants (sorted by sort_order)
  useEffect(() => {
    const sortedPlayers = participants
      .filter(p => p.role !== 'storyteller')
      .sort((a, b) => a.sort_order - b.sort_order)
    setPlayerOrder(sortedPlayers.map(p => p.id))
  }, [participants])

  // Configure sensors for drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts (prevents accidental drags)
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

    // Optimistic update
    setPlayerOrder(newOrder)

    // Persist to database
    try {
      await updateParticipantOrder(newOrder)
    } catch (error) {
      // Revert on error
      setPlayerOrder(playerOrder)
      console.error('Failed to persist order:', error)
    }
  }

  // Mark conversation as read when opening
  useEffect(() => {
    if (selectedParticipant) {
      markConversationRead(participantId)
    }
  }, [selectedParticipant, participantId])

  // Desktop: Split-panel layout with sidebar and inline conversation
  if (isDesktop) {
    const handleSelectPlayer = (player: Participant | null) => {
      setSelectedParticipant(player)
      setIsBroadcastMode(false)
    }

    const handleSelectBroadcast = () => {
      setSelectedParticipant(null)
      setIsBroadcastMode(true)
    }

    // Determine conversation panel content
    const renderConversationPanel = () => {
      if (selectedParticipant) {
        return (
          <DesktopConversationPanel
            key={selectedParticipant.id}
            roomId={roomId}
            participantId={participantId}
            recipientId={selectedParticipant.id}
            recipientName={selectedParticipant.display_name}
            participants={participants}
          />
        )
      }

      if (isBroadcastMode) {
        return (
          <DesktopConversationPanel
            key="broadcast"
            roomId={roomId}
            participantId={participantId}
            recipientId={null}
            recipientName="All Players"
            participants={participants}
          />
        )
      }

      // Default: show placeholder
      return (
        <Stack h="100%" justify="center" align="center" gap="md">
          <Text size="xl" c="dimmed">
            {'\u{1F4AC}'}
          </Text>
          <Text size="lg" c="dimmed" ta="center">
            Select a player to start chatting
          </Text>
          <Text size="sm" c="dimmed" ta="center">
            Or send a broadcast to all players
          </Text>
        </Stack>
      )
    }

    return (
      <>
        <SplitPanelLayout
          sidebar={
            <PlayerSidebar
              roomId={roomId}
              participantId={participantId}
              participants={participants}
              selectedPlayerId={selectedParticipant?.id || null}
              onSelectPlayer={handleSelectPlayer}
              onSelectBroadcast={handleSelectBroadcast}
              isBroadcastSelected={isBroadcastMode}
              onResetGame={() => setResetModalOpened(true)}
            />
          }
          main={renderConversationPanel()}
        />

        {/* Reset Confirmation Modal (rendered outside split-panel for proper z-index) */}
        <GameResetModal
          roomId={roomId}
          opened={resetModalOpened}
          onClose={() => setResetModalOpened(false)}
        />
      </>
    )
  }

  // Mobile: Full-screen conversation overlay when selected
  if (selectedParticipant) {
    return (
      <ConversationView
        roomId={roomId}
        participantId={participantId}
        recipientId={selectedParticipant.id}
        recipientName={selectedParticipant.display_name}
        onBack={() => setSelectedParticipant(null)}
        participants={participants}
      />
    )
  }

  // Mobile: Full-screen broadcast when active
  if (isBroadcastMode) {
    return (
      <ConversationView
        roomId={roomId}
        participantId={participantId}
        recipientId={null}
        recipientName="All Players"
        onBack={() => setIsBroadcastMode(false)}
        participants={participants}
      />
    )
  }

  // Mobile: Card-based dashboard with drag-and-drop
  return (
    <Stack gap="md" p="md">
      {/* Header */}
      <Stack gap="xs">
        <Text size="xl" fw={700} c="crimson">
          Player Dashboard
        </Text>
        <Text size="sm" c="dimmed">
          Tap a player to chat, drag to reorder
        </Text>
      </Stack>

      {/* Player Cards Grid with Drag-and-Drop */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={playerOrder} strategy={rectSortingStrategy}>
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            {/* Broadcast Card - Always first, not draggable */}
            <BroadcastCard
              roomId={roomId}
              participantId={participantId}
              onClick={() => setIsBroadcastMode(true)}
            />

            {/* Sortable Player Cards */}
            {playerOrder.map(playerId => {
              const player = participants.find(p => p.id === playerId)
              if (!player) return null
              return (
                <SortablePlayerCard
                  key={player.id}
                  roomId={roomId}
                  participantId={participantId}
                  player={player}
                  onClick={() => setSelectedParticipant(player)}
                />
              )
            })}
          </SimpleGrid>
        </SortableContext>
      </DndContext>

      {/* Empty state if no players */}
      {playerOrder.length === 0 && (
        <Text size="sm" c="dimmed" ta="center" py="xl">
          No players in the room yet. Share the room code to invite players.
        </Text>
      )}

      {/* Reset Game Section */}
      <Divider my="lg" />
      <Group justify="center">
        <Button
          variant="subtle"
          color="red"
          leftSection={<IconRefresh size={16} />}
          onClick={() => setResetModalOpened(true)}
        >
          Reset Game
        </Button>
      </Group>

      {/* Reset Confirmation Modal */}
      <GameResetModal
        roomId={roomId}
        opened={resetModalOpened}
        onClose={() => setResetModalOpened(false)}
      />
    </Stack>
  )
}

/**
 * Broadcast card with unread count badge.
 */
function BroadcastCard({
  roomId,
  participantId,
  onClick,
}: {
  roomId: string
  participantId: string
  onClick: () => void
}) {
  const unreadCount = useUnreadCount(roomId, participantId, null)

  return (
    <Card
      shadow="sm"
      padding="lg"
      radius="md"
      withBorder
      className={styles.hoverCard}
      onClick={onClick}
    >
      <Group justify="space-between" mb="xs">
        <Group gap="sm">
          <Text size="xl">📢</Text>
          <Stack gap={4}>
            <Text fw={500}>Broadcast to All</Text>
            <Text size="xs" c="dimmed">
              Send message to all players
            </Text>
          </Stack>
        </Group>
        {unreadCount > 0 && (
          <Badge color="red" variant="filled" size="lg">
            {unreadCount}
          </Badge>
        )}
      </Group>
    </Card>
  )
}

