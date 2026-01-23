import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import {
  Container,
  Stack,
  Title,
  Text,
  TextInput,
  Button,
  Loader,
  Center,
} from '@mantine/core'
import { useForm, matches } from '@mantine/form'
import { useAuth } from '../../hooks/useAuth'
import { joinRoom } from '../../lib/rooms'

/**
 * Room joining page for Players.
 *
 * Follows RESEARCH.md Pattern 5 (upsert participant for reconnection).
 * Validates 4-letter room code, joins room with user preferences from
 * localStorage, and navigates to room page on success.
 *
 * Flow:
 * 1. Verify session exists (redirect to /setup if not)
 * 2. User enters 4-letter room code
 * 3. Validate code format (exactly 4 letters, case-insensitive)
 * 4. Join room with displayName/avatar from localStorage
 * 5. Navigate to /room/:roomId on success
 *
 * Note: Uses upsert to handle reconnection (prevents duplicates).
 */
export function JoinRoomPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { session, loading: authLoading } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [autoJoinError, setAutoJoinError] = useState<string | null>(null)

  // Get room code from URL if present
  const urlRoomCode = searchParams.get('code')?.toUpperCase() || null
  const isValidUrlCode = urlRoomCode && /^[A-Z]{4}$/.test(urlRoomCode)

  // Auto-join when room code is in URL
  useEffect(() => {
    if (!isValidUrlCode || authLoading) return

    let isMounted = true

    async function autoJoin() {
      // Check for session
      if (!session) {
        navigate(`/setup?next=join&code=${urlRoomCode}`)
        return
      }

      // Check for display name and avatar
      let displayName: string | null = null
      let avatar: string | null = null

      try {
        displayName = localStorage.getItem('displayName')
        avatar = localStorage.getItem('avatar')
      } catch (err) {
        console.error('localStorage access failed:', err)
        navigate(`/setup?next=join&code=${urlRoomCode}`)
        return
      }

      if (!displayName || !avatar) {
        navigate(`/setup?next=join&code=${urlRoomCode}`)
        return
      }

      setIsLoading(true)
      try {
        const participant = await joinRoom(
          urlRoomCode!,
          session.user.id,
          displayName,
          avatar
        )

        if (isMounted) {
          navigate(`/room/${participant.room_id}`)
        }
      } catch (err) {
        console.error('Auto-join failed:', err)
        if (isMounted) {
          setAutoJoinError(
            err instanceof Error && err.message === 'Room not found'
              ? 'Room not found. Check the code and try again.'
              : 'Failed to join room. Please try again.'
          )
          setIsLoading(false)
        }
      }
    }

    autoJoin()

    return () => {
      isMounted = false
    }
  }, [isValidUrlCode, urlRoomCode, authLoading, session, navigate])

  // Form setup with room code validator (case-insensitive, letters only)
  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      roomCode: '',
    },
    validate: {
      roomCode: matches(
        /^[A-Za-z]{4}$/,
        'Room code must be exactly 4 letters'
      ),
    },
  })

  async function handleSubmit(values: { roomCode: string }) {
    // Wait for auth to finish loading
    if (authLoading) {
      return
    }

    // Check for session
    if (!session) {
      navigate('/setup?next=join')
      return
    }

    // Check for display name and avatar
    let displayName: string | null = null
    let avatar: string | null = null

    try {
      displayName = localStorage.getItem('displayName')
      avatar = localStorage.getItem('avatar')
    } catch (err) {
      console.error('localStorage access failed:', err)
      navigate('/setup?next=join')
      return
    }

    if (!displayName || !avatar) {
      navigate('/setup?next=join')
      return
    }

    setIsLoading(true)
    try {
      // Join room (upsert participant)
      const participant = await joinRoom(
        values.roomCode.trim().toUpperCase(),
        session.user.id,
        displayName,
        avatar
      )

      // Navigate to room
      navigate(`/room/${participant.room_id}`)
    } catch (err) {
      console.error('Join room failed:', err)
      form.setErrors({
        roomCode:
          err instanceof Error && err.message === 'Room not found'
            ? 'Room not found. Check the code and try again.'
            : 'Failed to join room. Please try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading state when auto-joining from URL
  if (isValidUrlCode && isLoading && !autoJoinError) {
    return (
      <Container size="xs" py="xl">
        <Stack gap="lg" align="center">
          <Title order={2} c="crimson" ta="center">
            Joining Room
          </Title>
          <Center>
            <Loader color="crimson" size="lg" />
          </Center>
          <Text size="sm" c="dimmed" ta="center">
            Joining room {urlRoomCode}...
          </Text>
        </Stack>
      </Container>
    )
  }

  return (
    <Container size="xs" py="xl">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="lg">
          <Title order={2} c="crimson" ta="center">
            Join Room
          </Title>

          {autoJoinError && (
            <Text c="red" ta="center" size="sm">
              {autoJoinError}
            </Text>
          )}

          <TextInput
            label="Room Code"
            placeholder="ABCD"
            key={form.key('roomCode')}
            {...form.getInputProps('roomCode')}
            maxLength={4}
            size="lg"
            styles={{
              input: {
                textTransform: 'uppercase',
                textAlign: 'center',
                fontSize: '2rem',
                letterSpacing: '0.5rem',
                fontFamily: 'monospace',
              },
            }}
          />

          <Text size="sm" c="dimmed" ta="center">
            Enter the 4-letter room code from your Storyteller
          </Text>

          <Button
            type="submit"
            fullWidth
            size="lg"
            loading={isLoading}
            color="crimson"
          >
            Join
          </Button>
        </Stack>
      </form>
    </Container>
  )
}
