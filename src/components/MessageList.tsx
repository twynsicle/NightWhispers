import { useRef, useEffect, useState } from 'react'
import { ScrollArea, Stack, Text, Group, Skeleton } from '@mantine/core'
import type { Message } from '../lib/supabase'
import { AnimatedMessage } from './AnimatedMessage'
import styles from './MessageList.module.css'

// Partial participant type for display name lookup
type ParticipantInfo = {
  id: string
  display_name: string
}

interface MessageListProps {
  messages: Message[]
  currentParticipantId: string
  loading?: boolean
  typingUsers?: string[]
  participants?: ParticipantInfo[]
}

/**
 * Scrollable message list with auto-scroll to bottom.
 *
 * Displays message bubbles with sender/received styling differentiation.
 * Auto-scrolls to bottom on mount and when new messages arrive.
 *
 * Gothic theme: sent messages use crimson background, received messages use dark.6.
 *
 * @param messages - Array of messages to display
 * @param currentParticipantId - Current user's participant ID (to determine sent vs received)
 * @param loading - Whether messages are loading (shows skeleton)
 */
export function MessageList({
  messages,
  currentParticipantId,
  loading = false,
  typingUsers = [],
  participants = [],
}: MessageListProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Track initial message count to determine which messages are "new"
  // Messages at index >= initialCount are animated
  const [initialCount, setInitialCount] = useState<number | null>(null)

  // Capture initial count once loading completes
  // Using queueMicrotask to defer setState and satisfy lint rules
  useEffect(() => {
    if (!loading && initialCount === null) {
      queueMicrotask(() => setInitialCount(messages.length))
    }
  }, [loading, messages.length, initialCount])

  // Auto-scroll to bottom on mount and when messages change
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages.length])

  // Loading state: show skeleton
  if (loading) {
    return (
      <Stack gap="sm" p="md" className={styles.loadingContainer}>
        <Skeleton height={60} radius="md" />
        <Skeleton height={60} radius="md" />
        <Skeleton height={60} radius="md" />
      </Stack>
    )
  }

  // Empty state
  if (messages.length === 0) {
    return (
      <Stack className={styles.emptyContainer} justify="center" align="center">
        <Text size="sm" c="dimmed" ta="center">
          No messages yet. Start the conversation!
        </Text>
      </Stack>
    )
  }

  // Helper: Format timestamp as relative time
  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min ago`

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`

    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  }

  return (
    <ScrollArea viewportRef={viewportRef} className={styles.scrollArea}>
      <Stack gap="sm" p="md">
        {messages.map((message, index) => {
          const isSent = message.sender_id === currentParticipantId
          const isBroadcast = message.is_broadcast
          // Messages at index >= initialCount are "new" and should animate
          const isNew = initialCount !== null && index >= initialCount

          return (
            <AnimatedMessage
              key={message.id}
              index={index - (initialCount ?? 0)}
              isNew={isNew}
            >
              <Group justify={isSent ? 'flex-end' : 'flex-start'} gap="xs">
                <Stack
                  gap={4}
                  className={`${styles.messageBubble} ${isSent ? styles.messageBubbleSent : styles.messageBubbleReceived}`}
                >
                  {/* Show broadcast badge for broadcast messages */}
                  {isBroadcast && (
                    <Text size="xs" c="dimmed" fw={500}>
                      Broadcast to All
                    </Text>
                  )}

                  {/* Message content */}
                  <Text size="sm" className={styles.messageContent}>
                    {message.content}
                  </Text>

                  {/* Timestamp */}
                  <Text size="xs" c="dimmed" ta={isSent ? 'right' : 'left'}>
                    {formatTimestamp(message.created_at)}
                  </Text>
                </Stack>
              </Group>
            </AnimatedMessage>
          )
        })}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <Group justify="flex-start" gap="xs">
            <Text size="sm" c="dimmed" fs="italic">
              {typingUsers
                .map(
                  userId =>
                    participants.find(p => p.id === userId)?.display_name ||
                    'Someone'
                )
                .join(', ')}{' '}
              {typingUsers.length === 1 ? 'is' : 'are'} typing...
            </Text>
          </Group>
        )}

        {/* Invisible element for auto-scroll target */}
        <div ref={bottomRef} />
      </Stack>
    </ScrollArea>
  )
}
