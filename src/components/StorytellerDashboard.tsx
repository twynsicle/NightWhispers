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
import type { Database } from '../lib/supabase'
import { ConversationView } from './ConversationView'
import { useUnreadCount, markConversationRead } from '../hooks/useUnreadCount'
import { GameResetModal } from './GameResetModal'
import { useDesktopLayout } from '../hooks/useDesktopLayout'
import { SplitPanelLayout } from './desktop/SplitPanelLayout'
import { PlayerSidebar } from './desktop/PlayerSidebar'
import { DesktopConversationPanel } from './desktop/DesktopConversationPanel'
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

  // Mobile: Card-based dashboard
  const players = participants.filter(p => p.role !== 'storyteller')

  return (
    <Stack gap="md" p="md">
      {/* Header */}
      <Stack gap="xs">
        <Text size="xl" fw={700} c="crimson">
          Player Dashboard
        </Text>
        <Text size="sm" c="dimmed">
          Tap a player to send private messages
        </Text>
      </Stack>

      {/* Player Cards Grid */}
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        {/* Broadcast Card - Always first */}
        <BroadcastCard
          roomId={roomId}
          participantId={participantId}
          onClick={() => setIsBroadcastMode(true)}
        />

        {/* Player Cards */}
        {players.map(player => (
          <PlayerCard
            key={player.id}
            roomId={roomId}
            participantId={participantId}
            player={player}
            onClick={() => setSelectedParticipant(player)}
          />
        ))}
      </SimpleGrid>

      {/* Empty state if no players */}
      {players.length === 0 && (
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

/**
 * Player card with unread count badge, dead status styling, and custom status.
 */
function PlayerCard({
  roomId,
  participantId,
  player,
  onClick,
}: {
  roomId: string
  participantId: string
  player: Participant
  onClick: () => void
}) {
  const unreadCount = useUnreadCount(roomId, participantId, player.id)
  const isDead = player.status === 'dead'

  return (
    <Card
      shadow="sm"
      padding="lg"
      radius="md"
      withBorder
      className={styles.hoverCard}
      style={{
        opacity: isDead ? 0.7 : 1,
      }}
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
              {isDead && <Text c="dimmed">&#128128;</Text>}
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
