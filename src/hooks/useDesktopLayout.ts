import { useMediaQuery } from '@mantine/hooks'
import { em } from '@mantine/core'

/**
 * Desktop layout detection hook.
 *
 * Uses 1024px breakpoint per UX-03 requirement.
 * SSR-safe via getInitialValueInEffect option.
 *
 * Reference: 06-RESEARCH.md "Desktop Breakpoint Hook"
 */
export function useDesktopLayout() {
  const isDesktop = useMediaQuery(`(min-width: ${em(1024)})`, false, {
    getInitialValueInEffect: true, // SSR-safe
  })

  return { isDesktop: isDesktop ?? false }
}
