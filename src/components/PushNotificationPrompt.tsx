import { Alert, Button, Text, Stack, Group } from '@mantine/core'
import { IconBell, IconBellOff, IconDeviceMobile } from '@tabler/icons-react'
import {
  usePushNotifications,
  type PushState,
} from '../hooks/usePushNotifications'

interface PushNotificationPromptProps {
  participantId: string
  onDismiss?: () => void
}

/**
 * Prompt for enabling push notifications.
 *
 * Shows different UI based on:
 * - prompt: Request permission button
 * - pwa-required: iOS "Add to Home Screen" guidance
 * - subscribed: Success state
 * - denied: Cannot enable, explain how to reset
 * - unsupported: Push not available
 */
export function PushNotificationPrompt({
  participantId,
  onDismiss,
}: PushNotificationPromptProps) {
  const { state, isLoading, subscribe } = usePushNotifications(participantId)

  const handleEnable = async () => {
    const success = await subscribe()
    if (success && onDismiss) {
      onDismiss()
    }
  }

  if (state === 'unsupported') {
    return null // Don't show anything
  }

  if (state === 'subscribed') {
    return (
      <Alert
        icon={<IconBell size={16} />}
        color="green"
        variant="light"
        withCloseButton
        onClose={onDismiss}
      >
        Notifications enabled! You'll be notified of new messages.
      </Alert>
    )
  }

  if (state === 'denied') {
    return (
      <Alert
        icon={<IconBellOff size={16} />}
        color="red"
        variant="light"
        withCloseButton
        onClose={onDismiss}
      >
        <Text size="sm">
          Notifications are blocked. To enable, update your browser settings for
          this site.
        </Text>
      </Alert>
    )
  }

  if (state === 'pwa-required') {
    return (
      <Alert
        icon={<IconDeviceMobile size={16} />}
        color="blue"
        variant="light"
        withCloseButton
        onClose={onDismiss}
      >
        <Stack gap="xs">
          <Text size="sm" fw={500}>
            Install Night Whispers for notifications
          </Text>
          <Text size="xs">
            On iOS, tap the Share button, then "Add to Home Screen" to enable
            push notifications.
          </Text>
        </Stack>
      </Alert>
    )
  }

  if (state === 'sw-unavailable') {
    return (
      <Alert
        icon={<IconBellOff size={16} />}
        color="yellow"
        variant="light"
        withCloseButton
        onClose={onDismiss}
      >
        <Text size="sm">
          Push notifications are not available in development mode. Build and
          serve the production app to enable notifications.
        </Text>
      </Alert>
    )
  }

  // state === 'prompt'
  return (
    <Alert icon={<IconBell size={16} />} color="crimson" variant="light">
      <Group justify="space-between" align="center">
        <Text size="sm">
          Enable notifications to know when you receive messages.
        </Text>
        <Group gap="xs">
          <Button size="xs" variant="light" color="gray" onClick={onDismiss}>
            Later
          </Button>
          <Button
            size="xs"
            variant="filled"
            color="crimson"
            loading={isLoading}
            onClick={handleEnable}
          >
            Enable
          </Button>
        </Group>
      </Group>
    </Alert>
  )
}

// Export PushState type for external use
export type { PushState }
