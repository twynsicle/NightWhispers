import { useEffect } from 'react'
import { Stack, Title, Text, ActionIcon, Group } from '@mantine/core'
import { IconArrowLeft } from '@tabler/icons-react'
import { useMessages } from '../hooks/useMessages'
import { useTypingIndicator } from '../hooks/useTypingIndicator'
import { markConversationRead } from '../hooks/useUnreadCount'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'

interface ConversationViewProps {
  roomId: string
  participantId: string
  recipientId: string | null
  recipientName: string
  onBack?: () => void
  participants?: Array<{ id: string; display_name: string }>
}

/**
 * Reusable conversation view component.
 *
 * Used by Storyteller for individual player chats and broadcast messages.
 * Supports back navigation to return to player cards dashboard.
 *
 * @param roomId - Room ID
 * @param participantId - Current user's participant ID
 * @param recipientId - Recipient's participant ID (null for broadcast)
 * @param recipientName - Recipient's display name (or "All Players" for broadcast)
 * @param onBack - Callback to navigate back to dashboard
 */
export function ConversationView({
  roomId,
  participantId,
  recipientId,
  recipientName,
  onBack,
  participants = [],
}: ConversationViewProps) {
  const { messages, loading, sendMessage, channel } = useMessages(
    roomId,
    participantId,
    recipientId
  )

  // Typing indicator
  const { setIsTyping, typingUsers } = useTypingIndicator(
    channel,
    participantId
  )

  // Filter typing users to only show the recipient
  const recipientTyping = recipientId
    ? typingUsers.filter(id => id === recipientId)
    : []

  const isBroadcast = recipientId === null
  const headerTitle = isBroadcast
    ? 'Broadcast to All Players'
    : `Chat with ${recipientName}`

  // Mark conversation as read when opened
  useEffect(() => {
    markConversationRead(participantId)
  }, [participantId])

  const handleSendMessage = async (content: string) => {
    await sendMessage(content)
  }

  return (
    <Stack h="100vh" gap={0}>
      {/* Header with back button */}
      <Stack
        gap="xs"
        p="md"
        style={{
          borderBottom: '1px solid var(--mantine-color-dark-4)',
          backgroundColor: 'var(--mantine-color-dark-7)',
        }}
      >
        <Group gap="sm">
          {onBack && (
            <ActionIcon
              variant="subtle"
              onClick={onBack}
              aria-label="Back to dashboard"
            >
              <IconArrowLeft size={20} />
            </ActionIcon>
          )}
          <Stack gap={4} style={{ flexGrow: 1 }}>
            <Title order={3} c="crimson">
              {headerTitle}
            </Title>
            <Text size="xs" c="dimmed">
              {isBroadcast
                ? 'Message visible to all players in the room'
                : 'Private conversation'}
            </Text>
          </Stack>
        </Group>
      </Stack>

      {/* Message List */}
      <MessageList
        messages={messages}
        currentParticipantId={participantId}
        loading={loading}
        typingUsers={recipientTyping}
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
    </Stack>
  )
}
