import { useState, useEffect, useCallback } from 'react'
import {
  isPWAInstalled,
  canSubscribeToPush,
  getNotificationPermission,
} from '../lib/pwa'
import {
  subscribeToPush,
  savePushSubscription,
  removePushSubscription,
} from '../lib/push-subscription'

// VAPID public key - this is safe to expose client-side
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || ''

export type PushState =
  | 'unsupported' // Push not available (no service worker or not PWA on iOS)
  | 'prompt' // Can request permission
  | 'subscribed' // Subscribed to push
  | 'denied' // User denied permission
  | 'pwa-required' // iOS: need to install PWA first
  | 'sw-unavailable' // Service worker not registered (dev mode)

interface UsePushNotificationsResult {
  state: PushState
  isLoading: boolean
  subscribe: () => Promise<boolean>
  unsubscribe: () => Promise<void>
  isPWA: boolean
}

/**
 * Hook for managing push notification subscription.
 *
 * Handles:
 * - Permission state detection
 * - iOS PWA requirement detection
 * - Subscription management
 * - Database persistence
 */
export function usePushNotifications(
  participantId: string | null
): UsePushNotificationsResult {
  const [state, setState] = useState<PushState>('unsupported')
  const [isLoading, setIsLoading] = useState(true)
  const isPWA = isPWAInstalled()

  // Determine initial state
  useEffect(() => {
    async function checkState() {
      setIsLoading(true)

      // Check if push is available
      if (!canSubscribeToPush()) {
        // On iOS, check if PWA installation is needed
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
        if (isIOS && !isPWA) {
          setState('pwa-required')
        } else {
          setState('unsupported')
        }
        setIsLoading(false)
        return
      }

      // Check notification permission
      const permission = getNotificationPermission()
      if (permission === 'denied') {
        setState('denied')
        setIsLoading(false)
        return
      }

      // Check if service worker is registered (may not be in dev mode)
      const registrations = await navigator.serviceWorker.getRegistrations()
      if (registrations.length === 0) {
        setState('sw-unavailable')
        setIsLoading(false)
        return
      }

      // Check if already subscribed
      if (permission === 'granted') {
        // Use timeout to avoid hanging if SW isn't ready
        const registration = await Promise.race([
          navigator.serviceWorker.ready,
          new Promise<null>(resolve => setTimeout(() => resolve(null), 3000)),
        ])

        if (registration) {
          const subscription = await registration.pushManager.getSubscription()
          if (subscription) {
            setState('subscribed')
            setIsLoading(false)
            return
          }
        } else {
          setState('sw-unavailable')
          setIsLoading(false)
          return
        }
      }

      setState('prompt')
      setIsLoading(false)
    }

    checkState()
  }, [isPWA])

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!participantId || !VAPID_PUBLIC_KEY) {
      console.error('Missing participantId or VAPID key')
      return false
    }

    setIsLoading(true)

    try {
      const subscription = await subscribeToPush(VAPID_PUBLIC_KEY)
      if (!subscription) {
        // Check if permission was denied or SW unavailable
        const permission = getNotificationPermission()
        if (permission === 'denied') {
          setState('denied')
        } else {
          // Permission granted but SW not available (dev mode)
          setState('sw-unavailable')
        }
        return false
      }

      // Save to database
      await savePushSubscription(participantId, subscription)
      setState('subscribed')
      return true
    } catch (error) {
      console.error('Failed to subscribe:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [participantId])

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<void> => {
    if (!participantId) return

    setIsLoading(true)

    try {
      // Unsubscribe from push service
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      if (subscription) {
        await subscription.unsubscribe()
      }

      // Remove from database
      await removePushSubscription(participantId)
      setState('prompt')
    } catch (error) {
      console.error('Failed to unsubscribe:', error)
    } finally {
      setIsLoading(false)
    }
  }, [participantId])

  return {
    state,
    isLoading,
    subscribe,
    unsubscribe,
    isPWA,
  }
}
