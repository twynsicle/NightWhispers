/**
 * PWA utilities for installation and push subscription detection.
 *
 * iOS Safari only supports push notifications when:
 * 1. App is installed to Home Screen
 * 2. Manifest has display: 'standalone'
 *
 * Reference: 06-RESEARCH.md "Detect PWA Installation State"
 */

/**
 * Check if app is running in standalone PWA mode.
 * Returns true if installed to home screen.
 */
export function isPWAInstalled(): boolean {
  // iOS Safari
  if (
    'standalone' in navigator &&
    (navigator as Navigator & { standalone?: boolean }).standalone
  ) {
    return true
  }

  // Chrome, Edge, etc.
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true
  }

  return false
}

/**
 * Check if push notifications can be subscribed.
 * Requires service worker AND PushManager (iOS only in PWA mode).
 */
export function canSubscribeToPush(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window
}

/**
 * Check if Notifications API is available.
 */
export function areNotificationsSupported(): boolean {
  return 'Notification' in window
}

/**
 * Get current notification permission state.
 */
export function getNotificationPermission():
  | NotificationPermission
  | 'unsupported' {
  if (!areNotificationsSupported()) {
    return 'unsupported'
  }
  return Notification.permission
}
