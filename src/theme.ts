import { createTheme } from '@mantine/core'
import type { MantineColorsTuple } from '@mantine/core'

// Crimson red color palette for gothic theme
const crimson: MantineColorsTuple = [
  '#ffe9e9',
  '#ffd1d1',
  '#fba0a1',
  '#f76d6d',
  '#f44141',
  '#f22625',
  '#f21616',
  '#d8070b',
  '#c10007',
  '#a90003',
]

export const theme = createTheme({
  // Primary color for accents (crimson red)
  primaryColor: 'crimson',
  colors: {
    crimson,
  },

  // System fonts for fast loading on mobile
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  fontFamilyMonospace:
    'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',

  // Subtle rounded corners
  defaultRadius: 'sm',

  // Heading styles for gothic feel
  headings: {
    fontWeight: '600',
  },
})
