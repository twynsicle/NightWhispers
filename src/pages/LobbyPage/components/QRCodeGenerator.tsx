import { useEffect, useState } from 'react'
import { Stack, Text, Button, Skeleton } from '@mantine/core'
import { IconCopy } from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import QRCode from 'qrcode'
import styles from './QRCodeGenerator.module.css'

interface QRCodeGeneratorProps {
  url: string
  size?: number
}

/**
 * QR code generator component for room sharing.
 *
 * Generates a QR code from the provided URL using the qrcode library.
 * Uses gothic theme colors (crimson for dark pixels).
 *
 * Features:
 * - Auto-generates QR code on mount and when url/size changes
 * - Loading state with skeleton placeholder
 * - Copy to clipboard functionality with notification
 * - Mobile-friendly sizing (256px default)
 *
 * @param url - The URL to encode in the QR code
 * @param size - QR code size in pixels (default 256)
 */
export function QRCodeGenerator({ url, size = 256 }: QRCodeGeneratorProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Track if component is still mounted to prevent state updates after unmount
    let isMounted = true

    // Generate QR code
    QRCode.toDataURL(url, {
      width: size,
      margin: 2,
      color: {
        dark: '#c92a2a', // Crimson for gothic theme
        light: '#1a1b1e', // Dark.9 background
      },
    })
      .then(dataUrl => {
        if (isMounted) {
          setQrDataUrl(dataUrl)
          setError(null)
        }
      })
      .catch(err => {
        if (isMounted) {
          console.error('Failed to generate QR code:', err)
          setError('Failed to generate QR code')
          setQrDataUrl(null)
        }
      })

    // Cleanup function
    return () => {
      isMounted = false
    }
  }, [url, size])

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(url)
      notifications.show({
        title: 'Link copied!',
        message: 'Join URL copied to clipboard',
        color: 'green',
      })
    } catch (err) {
      console.error('Failed to copy URL:', err)
      notifications.show({
        title: 'Copy failed',
        message: 'Could not copy to clipboard',
        color: 'red',
      })
    }
  }

  return (
    <Stack align="center" gap="md">
      {error ? (
        <Text c="red" size="sm">
          {error}
        </Text>
      ) : qrDataUrl ? (
        <img
          src={qrDataUrl}
          alt="QR code for room join URL"
          className={styles.qrImage}
          width={size}
          height={size}
        />
      ) : (
        <Skeleton width={size} height={size} radius="md" />
      )}

      <Text size="sm" c="dimmed" ta="center">
        Scan to join
      </Text>

      <Button
        variant="light"
        leftSection={<IconCopy size={16} />}
        onClick={handleCopyUrl}
        fullWidth
      >
        Copy Link
      </Button>
    </Stack>
  )
}
