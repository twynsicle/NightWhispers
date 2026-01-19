import { useEffect } from 'react'
import { Container, Title, Text, Button, Stack } from '@mantine/core'
import { supabase } from './lib/supabase'
import { env } from './lib/env'

function App() {
  const handleClick = () => {
    console.log('App loaded')
  }

  useEffect(() => {
    async function checkConnection() {
      try {
        // Simple query to verify connection (will fail with RLS, but connection works)
        const { error } = await supabase.from('rooms').select('count').limit(0)

        if (error && !error.message.includes('permission denied')) {
          console.error('Supabase connection error:', error.message)
        } else {
          console.log('Supabase connected successfully')
        }
      } catch (err) {
        console.error('Supabase connection failed:', err)
      }
    }

    if (env.supabase.url && env.supabase.anonKey) {
      checkConnection()
    } else {
      console.warn('Supabase credentials not configured - see .env.example')
    }
  }, [])

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
