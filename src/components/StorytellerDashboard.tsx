import { useState } from 'react'
import { SimpleGrid, Card, Text, Group, Badge, Stack } from '@mantine/core'
import type { Database } from '../lib/supabase'
import { ConversationView } from './ConversationView'

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
 * - MSG-04: Storyteller can broadcast message to all players
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
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null)
  const [isBroadcastMode, setIsBroadcastMode] = useState(false)

  // If conversation is open, render ConversationView
  if (selectedParticipant) {
    return (
      <ConversationView
        roomId={roomId}
        participantId={participantId}
        recipientId={selectedParticipant.id}
        recipientName={selectedParticipant.display_name}
        onBack={() => setSelectedParticipant(null)}
      />
    )
  }

  // If broadcast mode is active, render ConversationView for broadcast
  if (isBroadcastMode) {
    return (
      <ConversationView
        roomId={roomId}
        participantId={participantId}
        recipientId={null}
        recipientName="All Players"
        onBack={() => setIsBroadcastMode(false)}
      />
    )
  }

  // Filter out Storyteller from player list
  const players = participants.filter((p) => p.role !== 'storyteller')

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
        <Card
          shadow="sm"
          padding="lg"
          radius="md"
          withBorder
          style={{ cursor: 'pointer' }}
          onClick={() => setIsBroadcastMode(true)}
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
            <Badge color="crimson" variant="filled">
              0
            </Badge>
          </Group>
        </Card>

        {/* Player Cards */}
        {players.map((player) => (
          <Card
            key={player.id}
            shadow="sm"
            padding="lg"
            radius="md"
            withBorder
            style={{ cursor: 'pointer' }}
            onClick={() => setSelectedParticipant(player)}
          >
            <Group justify="space-between" mb="xs">
              <Group gap="sm">
                {/* Avatar */}
                {player.avatar_id && (
                  <Text size="xl">{player.avatar_id}</Text>
                )}

                {/* Name and Role */}
                <Stack gap={4}>
                  <Text fw={500}>{player.display_name}</Text>
                  <Text size="xs" c="dimmed">
                    Player
                  </Text>
                </Stack>
              </Group>

              {/* Unread count badge (placeholder - will be implemented in 04-03) */}
              <Badge color="gray" variant="light">
                0
              </Badge>
            </Group>
          </Card>
        ))}
      </SimpleGrid>

      {/* Empty state if no players */}
      {players.length === 0 && (
        <Text size="sm" c="dimmed" ta="center" py="xl">
          No players in the room yet. Share the room code to invite players.
        </Text>
      )}
    </Stack>
  )
}
