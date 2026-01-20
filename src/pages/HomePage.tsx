import { useNavigate } from 'react-router'
import { Container, Stack, Title, Text, Button } from '@mantine/core'

/**
 * Landing page for Night Whispers.
 *
 * Provides entry point for Storyteller (create room) and Players (join room).
 * Both flows navigate to /setup with ?next param for session setup.
 *
 * Flow:
 * - Create Room -> /setup?next=create -> /create (room creation)
 * - Join Room -> /setup?next=join -> /join (enter room code)
 */
export function HomePage() {
  const navigate = useNavigate()

  return (
    <Container size="xs" py="xl">
      <Stack gap="xl" align="center">
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
