import { supabase } from '../../../lib/supabase'
import { SERVICE_WORKER_READY_TIMEOUT_MS } from '../../../lib/constants'

/**
 * Convert VAPID public key from base64 URL to Uint8Array.
 * Required for PushManager.subscribe().
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

/**
 * Wait for service worker with timeout.
 * Returns registration or null if timeout/not available.
 */
async function waitForServiceWorker(
  timeoutMs: number = SERVICE_WORKER_READY_TIMEOUT_MS
): Promise<ServiceWorkerRegistration | null> {
  // Check if any service worker is registered
  const registrations = await navigator.serviceWorker.getRegistrations()
  if (registrations.length === 0) {
    console.log('No service worker registered')
    return null
  }

  // Race against timeout
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<null>(resolve => setTimeout(() => resolve(null), timeoutMs)),
  ])
}

/**
 * Subscribe to push notifications.
 * Returns the subscription or null if failed.
 */
export async function subscribeToPush(
  vapidPublicKey: string
): Promise<PushSubscription | null> {
  // Check if push is supported
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('Push not supported')
    return null
  }

  // Request permission
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    console.log('Notification permission denied')
    return null
  }

  // Get service worker registration with timeout
  const registration = await waitForServiceWorker()
  if (!registration) {
    console.log('Service worker not ready (may not be registered in dev mode)')
    return null
  }

  // Subscribe to push
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
  })

  return subscription
}

/**
 * Save push subscription to database.
 */
export async function savePushSubscription(
  participantId: string,
  subscription: PushSubscription
): Promise<void> {
  const subscriptionJson = subscription.toJSON()

  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      participant_id: participantId,
      endpoint: subscriptionJson.endpoint!,
      p256dh: subscriptionJson.keys!.p256dh,
      auth: subscriptionJson.keys!.auth,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: 'endpoint',
    }
  )

  if (error) {
    throw new Error(`Failed to save subscription: ${error.message}`)
  }
}

/**
 * Remove push subscription from database.
 */
export async function removePushSubscription(
  participantId: string
): Promise<void> {
  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('participant_id', participantId)

  if (error) {
    throw new Error(`Failed to remove subscription: ${error.message}`)
  }
}

/**
 * Send push notification via Edge Function.
 */
export async function sendPushNotification(
  subscription: {
    endpoint: string
    keys: { p256dh: string; auth: string }
  },
  payload: {
    title: string
    body: string
    tag?: string
    url?: string
    roomId?: string
  }
): Promise<{ success: boolean; expired?: boolean }> {
  const { data, error } = await supabase.functions.invoke('send-push', {
    body: { subscription, payload },
  })

  if (error) {
    console.error('Failed to send push:', error)
    return { success: false }
  }

  return data
}

/**
 * Send push notification to a specific recipient.
 * Subscription lookup happens server-side (bypasses RLS).
 *
 * @param recipientId - Participant ID to send notification to
 * @param payload - Notification content
 * @returns Result with sent count (0 if recipient not subscribed)
 */
export async function sendPushToRecipient(
  recipientId: string,
  payload: {
    title: string
    body: string
    tag?: string
    url?: string
    roomId?: string
  }
): Promise<{ success: boolean; sent: number; reason?: string }> {
  const { data, error } = await supabase.functions.invoke('send-push', {
    body: { recipientId, payload },
  })

  if (error) {
    console.error('Failed to send push to recipient:', error)
    return { success: false, sent: 0 }
  }

  return data
}

/**
 * Send push notification to all subscribed participants in a room.
 * Subscription lookup happens server-side (bypasses RLS).
 * Automatically excludes the sender from receiving their own notification.
 *
 * @param roomId - Room to broadcast to
 * @param excludeSenderId - Participant ID to exclude (the sender)
 * @param payload - Notification content
 * @returns Result with sent/failed counts
 */
export async function sendPushToRoom(
  roomId: string,
  excludeSenderId: string,
  payload: {
    title: string
    body: string
    tag?: string
    url?: string
    roomId?: string
  }
): Promise<{ success: boolean; sent: number; failed?: number }> {
  const { data, error } = await supabase.functions.invoke('send-push', {
    body: { roomId, excludeSenderId, payload },
  })

  if (error) {
    console.error('Failed to send push to room:', error)
    return { success: false, sent: 0 }
  }

  return data
}
