import { useEffect } from 'react'
import { Stack, Title, Text, ActionIcon, Group, Box } from '@mantine/core'
import { IconArrowLeft } from '@tabler/icons-react'
import type { Database } from '../../../lib/supabase'
import { useMessages } from '../hooks/useMessages'
import { useTypingIndicator } from '../hooks/useTypingIndicator'
import { markConversationRead } from '../hooks/useUnreadCount'
import { MessageList } from '../../../components/MessageList'
import { MessageInput } from '../../../components/MessageInput'
import { PlayerStatusControls } from './PlayerStatusControls'
import styles from './ConversationView.module.css'

type Participant = Database['public']['Tables']['participants']['Row']

interface ConversationViewProps {
  roomId: string
  participantId: string
  recipientId: string | null
  recipientName: string
  onBack?: () => void
  participants?: Participant[]
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

  // Find recipient participant for status controls (1-to-1 chats only)
  const recipient = recipientId
    ? participants.find(p => p.id === recipientId)
    : null

  // Mark conversation as read when opened
  useEffect(() => {
    markConversationRead(participantId)
  }, [participantId])

  const handleSendMessage = async (content: string) => {
    await sendMessage(content)
  }

  return (
    <Stack h="100vh" gap={0} className={styles.container}>
      {/* Header with back button */}
      <Stack gap="xs" p="md" className={styles.header}>
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
          <Stack gap={4} className={styles.headerContent}>
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

      {/* Player Status Controls (1-to-1 chats only, for Storyteller) */}
      {recipient && (
        <Stack p="md" className={styles.statusSection}>
          <PlayerStatusControls participant={recipient} />
        </Stack>
      )}

      {/* Message List */}
      <Box className={styles.messageListContainer}>
        <MessageList
          messages={messages}
          currentParticipantId={participantId}
          loading={loading}
          typingUsers={recipientTyping}
          participants={participants}
        />
      </Box>

      {/* Message Input */}
      <Stack p="md" className={styles.inputSection}>
        <MessageInput
          onSendMessage={handleSendMessage}
          typingHandler={{ setIsTyping }}
        />
      </Stack>
    </Stack>
  )
}
