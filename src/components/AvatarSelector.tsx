import { Grid, Button, Text } from '@mantine/core'

/**
 * Props interface for AvatarSelector component
 */
interface AvatarSelectorProps {
  /** Currently selected avatar emoji */
  value: string
  /** Called when user selects an avatar */
  onChange: (avatar: string) => void
  /** Validation error message to display */
  error?: string
}

/**
 * Gothic-themed emoji avatars for Night Whispers.
 * Excludes image assets for fast mobile loading.
 */
const AVATAR_OPTIONS = [
  '🧙‍♂️', // Wizard
  '🧛‍♀️', // Vampire
  '🧟‍♂️', // Zombie
  '👻', // Ghost
  '🎭', // Theater masks
  '🕵️', // Detective
  '🦇', // Bat
  '🌙', // Moon
  '⚰️', // Coffin
  '🔮', // Crystal ball
  '🗡️', // Dagger
  '🛡️', // Shield
]

/**
 * Grid-based avatar selector with emoji options.
 *
 * Follows RESEARCH.md Pattern 7 for mobile-friendly selection UI.
 * Uses Mantine Grid for responsive layout (4 cols mobile, 6 cols desktop).
 *
 * @example
 * ```tsx
 * <AvatarSelector
 *   value={form.values.avatar}
 *   onChange={(avatar) => form.setFieldValue('avatar', avatar)}
 *   error={form.errors.avatar}
 * />
 * ```
 */
export function AvatarSelector({
  value,
  onChange,
  error,
}: AvatarSelectorProps) {
  return (
    <div>
      <Grid gutter="sm">
        {AVATAR_OPTIONS.map(emoji => {
          const isSelected = value === emoji
          return (
            <Grid.Col key={emoji} span={{ base: 3, sm: 2 }}>
              <Button
                variant={isSelected ? 'filled' : 'light'}
                color="crimson"
                size="xl"
                fullWidth
                onClick={() => onChange(emoji)}
                aria-label={`Select ${emoji}`}
                aria-pressed={isSelected}
                styles={{
                  root: {
                    fontSize: '2.5rem',
                    height: '80px',
                  },
                  label: {
                    fontFamily:
                      '"Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", "Apple Color Emoji", sans-serif',
                  },
                }}
              >
                {emoji}
              </Button>
            </Grid.Col>
          )
        })}
      </Grid>
      {error && (
        <Text c="red" size="sm" mt="xs">
          {error}
        </Text>
      )}
    </div>
  )
}
