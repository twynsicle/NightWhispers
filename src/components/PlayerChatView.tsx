import { useState, useEffect } from 'react'
import { Stack, Title, Text, Group, ActionIcon } from '@mantine/core'
import { IconSettings } from '@tabler/icons-react'
import { useMessages } from '../hooks/useMessages'
import { useTypingIndicator } from '../hooks/useTypingIndicator'
import { supabase } from '../lib/supabase'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import { PlayerSettingsMenu } from './PlayerSettingsMenu'

interface PlayerChatViewProps {
  roomId: string
  participantId: string
  storytellerId: string
  storytellerName: string
  participants: Array<{ id: string; display_name: string }>
}

/**
 * Full-screen chat view for players.
 *
 * Players see a single conversation with the Storyteller.
 * Implements PLAY-01: Player can only chat with Storyteller (no player-to-player communication).
 *
 * Note: Players also receive broadcast messages automatically through the useMessages hook.
 * The hook subscribes to the room channel and filters for:
 * - 1-to-1 messages between player and storyteller
 * - Broadcast messages (is_broadcast=true)
 *
 * Features:
 * - Settings button in header for accessing room code and leave game
 * - Full-screen chat with auto-scroll
 * - Typing indicators
 *
 * @param roomId - Room ID
 * @param participantId - Current player's participant ID
 * @param storytellerId - Storyteller's participant ID (recipient for all messages)
 * @param storytellerName - Storyteller's display name
 */
export function PlayerChatView({
  roomId,
  participantId,
  storytellerId,
  storytellerName,
  participants,
}: PlayerChatViewProps) {
  // Room code state for settings menu
  const [roomCode, setRoomCode] = useState<string | null>(null)
  const [settingsOpened, setSettingsOpened] = useState(false)

  // Fetch room code on mount
  useEffect(() => {
    const fetchRoomCode = async () => {
      const { data } = await supabase
        .from('participants')
        .select('rooms(code)')
        .eq('id', participantId)
        .single()
      if (data?.rooms) {
        // Type assertion: rooms relation returns { code: string }
        setRoomCode((data.rooms as { code: string }).code)
      }
    }
    fetchRoomCode()
  }, [participantId])

  // Load conversation with Storyteller
  // recipientId = storytellerId ensures 1-to-1 messages are filtered correctly
  // Broadcast messages (is_broadcast=true) are also included by the hook
  const { messages, loading, sendMessage, channel } = useMessages(
    roomId,
    participantId,
    storytellerId
  )

  // Typing indicator for current user
  const { setIsTyping, typingUsers } = useTypingIndicator(
    channel,
    participantId
  )

  // Filter typing users to only show storyteller
  const storytellerTyping = typingUsers.filter(id => id === storytellerId)

  const handleSendMessage = async (content: string) => {
    await sendMessage(content)
  }

  return (
    <Stack h="100vh" gap={0}>
      {/* Header */}
      <Group
        justify="space-between"
        p="md"
        style={{
          borderBottom: '1px solid var(--mantine-color-dark-4)',
          backgroundColor: 'var(--mantine-color-dark-7)',
        }}
      >
        <Stack gap="xs">
          <Title order={3} c="crimson">
            Chat with {storytellerName}
          </Title>
          <Text size="xs" c="dimmed">
            Private conversation with the Storyteller
          </Text>
        </Stack>
        <ActionIcon
          variant="subtle"
          color="gray"
          size="lg"
          onClick={() => setSettingsOpened(true)}
          aria-label="Game settings"
        >
          <IconSettings size={22} />
        </ActionIcon>
      </Group>

      {/* Message List */}
      <MessageList
        messages={messages}
        currentParticipantId={participantId}
        loading={loading}
        typingUsers={storytellerTyping}
        participants={participants}
      />

      {/* Message Input */}
      <Stack
        p="md"
        style={{
          borderTop: '1px solid var(--mantine-color-dark-4)',
          backgroundColor: 'var(--mantine-color-dark-7)',
        }}
      >
        <MessageInput
          onSendMessage={handleSendMessage}
          typingHandler={{ setIsTyping }}
        />
      </Stack>

      {/* Settings Menu - only render when roomCode is loaded */}
      {roomCode !== null && (
        <PlayerSettingsMenu
          roomCode={roomCode}
          participantId={participantId}
          opened={settingsOpened}
          onClose={() => setSettingsOpened(false)}
        />
      )}
    </Stack>
  )
}
