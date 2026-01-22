import { Group, Box } from '@mantine/core'
import type { ReactNode } from 'react'
import styles from './SplitPanelLayout.module.css'

interface SplitPanelLayoutProps {
  sidebar: ReactNode
  main: ReactNode
  sidebarWidth?: number
}

/**
 * Split-panel layout for desktop Storyteller view.
 *
 * - Left: Player sidebar (fixed width)
 * - Right: Active conversation (flex)
 *
 * Implements DASH-04: Desktop shows split-panel (player list + chat)
 */
export function SplitPanelLayout({
  sidebar,
  main,
  sidebarWidth = 320,
}: SplitPanelLayoutProps) {
  return (
    <Group
      align="stretch"
      gap={0}
      wrap="nowrap"
      className={styles.container}
    >
      {/* Sidebar */}
      <Box w={sidebarWidth} className={styles.sidebar}>
        {sidebar}
      </Box>

      {/* Main content */}
      <Box className={styles.main}>{main}</Box>
    </Group>
  )
}
