import { Group, Box } from '@mantine/core'
import type { ReactNode } from 'react'

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
      style={{
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'var(--mantine-color-dark-8)',
      }}
    >
      {/* Sidebar */}
      <Box
        w={sidebarWidth}
        style={{
          borderRight: '1px solid var(--mantine-color-dark-4)',
          flexShrink: 0,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {sidebar}
      </Box>

      {/* Main content */}
      <Box style={{ flex: 1, overflow: 'hidden' }}>{main}</Box>
    </Group>
  )
}
