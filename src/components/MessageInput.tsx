import { useState, useEffect } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'
import { Textarea, ActionIcon, Group, Stack } from '@mantine/core'
import { IconSend } from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'

interface MessageInputProps {
  onSendMessage: (content: string) => Promise<void>
  disabled?: boolean
  typingHandler?: {
    setIsTyping: (typing: boolean) => void
  }
}

/**
 * Text input with send button for message composition.
 *
 * Supports multiline messages with Shift+Enter for newlines.
 * Enter key sends message.
 *
 * @param onSendMessage - Async callback to send message
 * @param disabled - Whether input is disabled
 */
export function MessageInput({
  onSendMessage,
  disabled = false,
  typingHandler,
}: MessageInputProps) {
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)

  // Clear typing state on unmount
  useEffect(() => {
    return () => {
      typingHandler?.setIsTyping(false)
    }
  }, [typingHandler])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    // Validate content
    if (!content.trim()) {
      return
    }

    // Clear typing state when sending
    typingHandler?.setIsTyping(false)

    // Disable input while sending
    setSending(true)

    try {
      await onSendMessage(content.trim())
      setContent('') // Clear input on success
    } catch (error) {
      console.error('Error sending message:', error)
      notifications.show({
        title: 'Error',
        message: 'Failed to send message. Please try again.',
        color: 'red',
      })
    } finally {
      setSending(false)
    }
  }

  // Handle Enter key (send) vs Shift+Enter (newline)
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as FormEvent)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="xs">
        <Group gap="xs" align="flex-end">
          <Textarea
            value={content}
            onChange={e => {
              setContent(e.currentTarget.value)
              // Emit typing indicator on change
              typingHandler?.setIsTyping(true)
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={disabled || sending}
            autosize
            minRows={1}
            maxRows={4}
            style={{ flexGrow: 1 }}
          />
          <ActionIcon
            type="submit"
            size="lg"
            variant="filled"
            color="crimson"
            disabled={disabled || sending || !content.trim()}
            loading={sending}
            aria-label="Send message"
          >
            <IconSend size={20} />
          </ActionIcon>
        </Group>
        <Group justify="space-between">
          <span />
          <Group gap={4}>
            <span
              style={{ fontSize: '11px', color: 'var(--mantine-color-dimmed)' }}
            >
              Enter to send
            </span>
            <span
              style={{ fontSize: '11px', color: 'var(--mantine-color-dimmed)' }}
            >
              •
            </span>
            <span
              style={{ fontSize: '11px', color: 'var(--mantine-color-dimmed)' }}
            >
              Shift+Enter for newline
            </span>
          </Group>
        </Group>
      </Stack>
    </form>
  )
}
