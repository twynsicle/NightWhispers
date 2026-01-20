import { useRef, useEffect } from 'react'
import { ScrollArea, Stack, Text, Group, Skeleton } from '@mantine/core'
import type { Message } from '../lib/supabase'

interface MessageListProps {
  messages: Message[]
  currentParticipantId: string
  loading?: boolean
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
}: MessageListProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on mount and when messages change
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages.length])

  // Loading state: show skeleton
  if (loading) {
    return (
      <Stack gap="sm" p="md">
        <Skeleton height={60} radius="md" />
        <Skeleton height={60} radius="md" />
        <Skeleton height={60} radius="md" />
      </Stack>
    )
  }

  // Empty state
  if (messages.length === 0) {
    return (
      <Stack h="100%" justify="center" align="center">
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
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`

    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  }

  return (
    <ScrollArea viewportRef={viewportRef} h="100%" style={{ flexGrow: 1 }}>
      <Stack gap="sm" p="md">
        {messages.map((message) => {
          const isSent = message.sender_id === currentParticipantId
          const isBroadcast = message.is_broadcast

          return (
            <Group
              key={message.id}
              justify={isSent ? 'flex-end' : 'flex-start'}
              gap="xs"
            >
              <Stack
                gap={4}
                style={{
                  maxWidth: '80%',
                  padding: '8px 12px',
                  borderRadius: 'var(--mantine-radius-md)',
                  backgroundColor: isSent
                    ? 'var(--mantine-color-crimson-9)'
                    : 'var(--mantine-color-dark-6)',
                }}
              >
                {/* Show broadcast badge for broadcast messages */}
                {isBroadcast && (
                  <Text size="xs" c="dimmed" fw={500}>
                    📢 Broadcast to All
                  </Text>
                )}

                {/* Message content */}
                <Text
                  size="sm"
                  style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                >
                  {message.content}
                </Text>

                {/* Timestamp */}
                <Text size="xs" c="dimmed" ta={isSent ? 'right' : 'left'}>
                  {formatTimestamp(message.created_at)}
                </Text>
              </Stack>
            </Group>
          )
        })}

        {/* Invisible element for auto-scroll target */}
        <div ref={bottomRef} />
      </Stack>
    </ScrollArea>
  )
}
