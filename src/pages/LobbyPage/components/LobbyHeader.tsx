import { ActionIcon } from '@mantine/core'
import { IconQrcode } from '@tabler/icons-react'
import styles from './LobbyHeader.module.css'

interface LobbyHeaderProps {
  roomCode: string
  onQrClick: () => void
}

/**
 * Fixed header for lobby page.
 *
 * Displays:
 * - App emoji (moon) on the left
 * - Room code centered
 * - QR code button on the right
 */
export function LobbyHeader({ roomCode, onQrClick }: LobbyHeaderProps) {
  return (
    <div className={styles.header}>
      <span className={styles.appIcon}>🌙</span>

      <div className={styles.roomCodeContainer}>
        <span className={styles.roomCodeLabel}>Room Code</span>
        <span className={styles.roomCode}>{roomCode}</span>
      </div>

      <ActionIcon
        variant="subtle"
        size="lg"
        onClick={onQrClick}
        aria-label="Show QR code"
      >
        <IconQrcode size={24} />
      </ActionIcon>
    </div>
  )
}
