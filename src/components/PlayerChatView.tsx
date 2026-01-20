import { Stack, Title, Text } from '@mantine/core'
import { useMessages } from '../hooks/useMessages'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'

interface PlayerChatViewProps {
  roomId: string
  participantId: string
  storytellerId: string
  storytellerName: string
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
}: PlayerChatViewProps) {
  // Load conversation with Storyteller
  // recipientId = storytellerId ensures 1-to-1 messages are filtered correctly
  // Broadcast messages (is_broadcast=true) are also included by the hook
  const { messages, loading, sendMessage } = useMessages(
    roomId,
    participantId,
    storytellerId
  )

  const handleSendMessage = async (content: string) => {
    await sendMessage(content)
  }

  return (
    <Stack h="100vh" gap={0}>
      {/* Header */}
      <Stack
        gap="xs"
        p="md"
        style={{
          borderBottom: '1px solid var(--mantine-color-dark-4)',
          backgroundColor: 'var(--mantine-color-dark-7)',
        }}
      >
        <Title order={3} c="crimson">
          Chat with {storytellerName}
        </Title>
        <Text size="xs" c="dimmed">
          Private conversation with the Storyteller
        </Text>
      </Stack>

      {/* Message List */}
      <MessageList
        messages={messages}
        currentParticipantId={participantId}
        loading={loading}
      />

      {/* Message Input */}
      <Stack
        p="md"
        style={{
          borderTop: '1px solid var(--mantine-color-dark-4)',
          backgroundColor: 'var(--mantine-color-dark-7)',
        }}
      >
        <MessageInput onSendMessage={handleSendMessage} />
      </Stack>
    </Stack>
  )
}
