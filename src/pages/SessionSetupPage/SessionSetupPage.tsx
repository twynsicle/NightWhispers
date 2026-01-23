import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { Container, Stack, Title, Text, TextInput, Button } from '@mantine/core'
import { useForm, hasLength, isNotEmpty } from '@mantine/form'
import { useAuth } from '../../hooks/useAuth'
import { AvatarSelector } from './components/AvatarSelector'

/**
 * Session setup page for display name and avatar selection.
 *
 * Follows RESEARCH.md Pattern 7 (Mantine form validation) and Pattern 2
 * (anonymous auth). Creates anonymous session if needed, stores user
 * preferences in localStorage, then navigates to create/join flow.
 *
 * Flow:
 * 1. User fills display name (2-20 chars) and selects avatar
 * 2. On submit, creates anonymous session if none exists
 * 3. Stores displayName and avatar in localStorage
 * 4. Navigates to /create or /join based on ?next param
 *
 * @example
 * Navigate from home:
 * - Create room: /setup?next=create
 * - Join room: /setup?next=join
 */
export function SessionSetupPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { signInAnonymously } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  // Get next action to determine page title
  const nextAction = searchParams.get('next') || 'create'
  const pageTitle = nextAction === 'create' ? 'Create a Room' : 'Join the Night'

  // Get saved values from localStorage
  const getSavedValue = (key: string) => {
    try {
      return localStorage.getItem(key) || ''
    } catch {
      return ''
    }
  }

  // Form setup with validators
  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      displayName: getSavedValue('displayName'),
      avatar: getSavedValue('avatar'),
    },
    validate: {
      displayName: hasLength(
        { min: 2, max: 20 },
        'Name must be 2-20 characters'
      ),
      avatar: isNotEmpty('Please select an avatar'),
    },
  })

  async function handleSubmit(values: { displayName: string; avatar: string }) {
    setIsLoading(true)
    try {
      // Create anonymous session if needed (throws on failure)
      await signInAnonymously()

      // Store preferences in localStorage for next step
      try {
        localStorage.setItem('displayName', values.displayName)
        localStorage.setItem('avatar', values.avatar)
      } catch (err) {
        console.error('localStorage write failed:', err)
        throw new Error(
          'Failed to save preferences. Please check browser settings.'
        )
      }

      // Navigate based on ?next param (default to create)
      const next = searchParams.get('next') || 'create'
      navigate(`/${next}`)
    } catch (error) {
      console.error('Session setup failed:', error)
      form.setErrors({
        displayName: 'Failed to create session. Please try again.',
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
            {pageTitle}
          </Title>

          <TextInput
            label="Display Name"
            placeholder="Enter your name"
            key={form.key('displayName')}
            {...form.getInputProps('displayName')}
            size="md"
          />

          <div>
            <Text size="sm" fw={500} mb="xs">
              Choose Avatar
            </Text>
            <AvatarSelector
              value={form.values.avatar}
              onChange={avatar => form.setFieldValue('avatar', avatar)}
              error={form.errors.avatar as string | undefined}
            />
          </div>

          <Button
            type="submit"
            fullWidth
            size="lg"
            loading={isLoading}
            color="crimson"
          >
            Continue
          </Button>
        </Stack>
      </form>
    </Container>
  )
}
