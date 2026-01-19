import { Container, Title, Text, Button, Stack } from '@mantine/core'

function App() {
  const handleClick = () => {
    console.log('App loaded')
  }

  return (
    <Container size="xs" py="xl">
      <Stack align="center" gap="md">
        <Title order={1}>Night Whispers</Title>
        <Text c="dimmed" size="lg">
          Social deduction companion
        </Text>
        <Button onClick={handleClick} size="lg" mt="md">
          Get Started
        </Button>
      </Stack>
    </Container>
  )
}

export default App
