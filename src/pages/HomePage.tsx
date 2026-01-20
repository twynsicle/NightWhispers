import { useNavigate, useSearchParams } from 'react-router'
import { Container, Stack, Title, Text, Button, Alert } from '@mantine/core'

/**
 * Landing page for Night Whispers.
 *
 * Provides entry point for Storyteller (create room) and Players (join room).
 * Both flows navigate to /setup with ?next param for session setup.
 *
 * Also displays error messages when redirected from protected routes.
 *
 * Flow:
 * - Create Room -> /setup?next=create -> /create (room creation)
 * - Join Room -> /setup?next=join -> /join (enter room code)
 * - Error redirect -> /?error={code} -> Show alert with user-friendly message
 */
export function HomePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const errorCode = searchParams.get('error')

  // Map error codes to user-friendly messages
  const errorMessages: Record<string, string> = {
    'no-session': 'Your session has expired. Please join again.',
    'session-invalid': 'Your session is no longer valid. Please join again.',
    'not-participant':
      'You are not in this room. You may have been kicked or the room was deleted.',
    'kicked': 'You were removed from the room by the Storyteller.',
  }

  const errorMessage = errorCode
    ? errorMessages[errorCode] || 'An error occurred. Please try again.'
    : null

  return (
    <Container size="xs" py="xl">
      <Stack gap="xl" align="center">
        {errorMessage && (
          <Alert
            color="red"
            variant="filled"
            title="Access Denied"
            withCloseButton
            onClose={() => navigate('/')}
          >
            {errorMessage}
          </Alert>
        )}

        <Title order={1} c="crimson" ta="center" size="3rem">
          Night Whispers
        </Title>

        <Text size="lg" c="dimmed" ta="center">
          Private messages for social deduction games
        </Text>

        <Stack gap="md" w="100%" mt="xl">
          <Button
            size="lg"
            fullWidth
            color="crimson"
            onClick={() => navigate('/setup?next=create')}
          >
            Create Room
          </Button>

          <Button
            size="lg"
            fullWidth
            variant="light"
            color="crimson"
            onClick={() => navigate('/setup?next=join')}
          >
            Join Room
          </Button>
        </Stack>

        <Text size="xs" c="dimmed" mt="xl" ta="center">
          Zero friction • No accounts • Just a room code
        </Text>
      </Stack>
    </Container>
  )
}
