import { Stack, Text, Card, Group, Badge, ScrollArea, Box } from '@mantine/core'
import { IconRefresh } from '@tabler/icons-react'
import type { Database } from '../../lib/supabase'
import { useUnreadCount } from '../../hooks/useUnreadCount'

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
 * - Player list with unread badges
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
  const players = participants.filter(p => p.role !== 'storyteller')

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

      {/* Player list */}
      <ScrollArea style={{ flex: 1 }}>
        <Stack gap={0} p="xs">
          {/* Broadcast option */}
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

          {/* Player items */}
          {players.map(player => (
            <SidebarItem
              key={player.id}
              icon={player.avatar_id || undefined}
              name={player.display_name}
              subtitle={player.status === 'dead' ? 'Dead' : undefined}
              customStatus={player.custom_status || undefined}
              selected={selectedPlayerId === player.id}
              onClick={() => onSelectPlayer(player)}
              isDead={player.status === 'dead'}
              roomId={roomId}
              participantId={participantId}
              playerId={player.id}
            />
          ))}
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
 * Individual sidebar item (player or broadcast).
 */
function SidebarItem({
  icon,
  name,
  subtitle,
  customStatus,
  selected,
  onClick,
  isDead,
  roomId,
  participantId,
  playerId,
}: {
  icon?: string
  name: string
  subtitle?: string
  customStatus?: string
  selected: boolean
  onClick: () => void
  isDead?: boolean
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
        opacity: isDead ? 0.7 : 1,
      }}
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
            {icon === 'broadcast' ? '\u{1F4E2}' : icon || '\u{1F464}'}
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
                {name}
              </Text>
              {isDead && (
                <Text size="sm" c="dimmed">
                  {'\u{1F480}'}
                </Text>
              )}
            </Group>
            {subtitle && (
              <Text size="xs" c="dimmed">
                {subtitle}
              </Text>
            )}
            {customStatus && (
              <Badge size="xs" variant="light" color="gray">
                {customStatus}
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
