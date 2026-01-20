import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { Container, Stack, Title, Text, Skeleton, Button } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useAuth } from '../hooks/useAuth'
import { createRoom } from '../lib/rooms'

/**
 * Room creation page for Storyteller.
 *
 * Follows RESEARCH.md Pattern 4 (room creation with collision retry).
 * Automatically creates room on mount after verifying session and retrieving
 * user preferences from localStorage.
 *
 * Flow:
 * 1. Verify session exists (redirect to /setup if not)
 * 2. Retrieve displayName and avatar from localStorage
 * 3. Create room with collision retry
 * 4. Display 4-letter room code
 * 5. Auto-navigate to /room/:roomId after 2 seconds
 *
 * Note: Storyteller profile update happens in room creation (createRoom adds
 * participant record with displayName/avatar from localStorage).
 */
export function CreateRoomPage() {
  const navigate = useNavigate()
  const { session, loading: authLoading } = useAuth()
  const [roomCode, setRoomCode] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function initialize() {
      // Wait for auth to finish loading
      if (authLoading) {
        return
      }

      // Check for session
      if (!session) {
        navigate('/setup?next=create')
        return
      }

      // Check for display name and avatar in localStorage
      const displayName = localStorage.getItem('displayName')
      const avatar = localStorage.getItem('avatar')

      if (!displayName || !avatar) {
        navigate('/setup?next=create')
        return
      }

      // Create room
      try {
        const { room } = await createRoom(session.user.id, true, displayName, avatar)
        setRoomCode(room.code)

        // Auto-navigate to room after 2 seconds
        setTimeout(() => {
          navigate(`/room/${room.id}`)
        }, 2000)
      } catch (err) {
        console.error('Room creation failed:', err)
        setError(err instanceof Error ? err.message : 'Failed to create room')
        notifications.show({
          title: 'Room Creation Failed',
          message: 'Could not create room. Please try again.',
          color: 'red',
        })
      } finally {
        setIsLoading(false)
      }
    }

    initialize()
  }, [session, authLoading, navigate])

  if (isLoading) {
    return (
      <Container size="xs" py="xl">
        <Stack gap="lg" align="center">
          <Title order={2} c="crimson">
            Creating Room...
          </Title>
          <Skeleton height={120} width="100%" />
        </Stack>
      </Container>
    )
  }

  if (error) {
    return (
      <Container size="xs" py="xl">
        <Stack gap="lg" align="center">
          <Title order={2} c="crimson">
            Room Creation Failed
          </Title>
          <Text c="red">{error}</Text>
          <Button onClick={() => window.location.reload()} color="crimson">
            Try Again
          </Button>
        </Stack>
      </Container>
    )
  }

  return (
    <Container size="xs" py="xl">
      <Stack gap="lg" align="center">
        <Title order={2} c="crimson">
          Room Created
        </Title>

        <Text size="lg">Share this code with your players:</Text>

        <Text
          size="3rem"
          fw={700}
          ta="center"
          ff="monospace"
          c="crimson"
          style={{ letterSpacing: '0.5rem' }}
        >
          {roomCode}
        </Text>

        <Text size="sm" c="dimmed">
          Players can enter this code to join
        </Text>

        <Text size="xs" c="dimmed" mt="md">
          Redirecting to room...
        </Text>
      </Stack>
    </Container>
  )
}
