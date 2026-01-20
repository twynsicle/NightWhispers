import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Container, Stack, Title, Text, TextInput, Button } from '@mantine/core'
import { useForm, matches } from '@mantine/form'
import { useAuth } from '../hooks/useAuth'
import { joinRoom } from '../lib/rooms'

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
 * 3. Validate code format (exactly 4 uppercase alphanumeric)
 * 4. Join room with displayName/avatar from localStorage
 * 5. Navigate to /room/:roomId on success
 *
 * Note: Uses upsert to handle reconnection (prevents duplicates).
 */
export function JoinRoomPage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  // Form setup with room code validator
  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      roomCode: '',
    },
    validate: {
      roomCode: matches(
        /^[A-Z0-9]{4}$/,
        'Room code must be exactly 4 letters/numbers'
      ),
    },
  })

  async function handleSubmit(values: { roomCode: string }) {
    // Check for session
    if (!session) {
      navigate('/setup?next=join')
      return
    }

    // Check for display name and avatar
    const displayName = localStorage.getItem('displayName')
    const avatar = localStorage.getItem('avatar')

    if (!displayName || !avatar) {
      navigate('/setup?next=join')
      return
    }

    setIsLoading(true)
    try {
      // Join room (upsert participant)
      const participant = await joinRoom(
        values.roomCode.toUpperCase(),
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

  return (
    <Container size="xs" py="xl">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="lg">
          <Title order={2} c="crimson" ta="center">
            Join Room
          </Title>

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
            Enter the 4-letter code from your Storyteller
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
