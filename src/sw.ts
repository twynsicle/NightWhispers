/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching'

declare const self: ServiceWorkerGlobalScope

// Precache static assets (injected by vite-plugin-pwa)
precacheAndRoute(self.__WB_MANIFEST)

// Push notification handler
self.addEventListener('push', (event: PushEvent) => {
  const data = event.data?.json() ?? {}

  // Note: vibrate is part of Notification API but not in TypeScript's NotificationOptions
  // Using type assertion to include it
  const options = {
    body: data.body || 'New message',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: data.tag || 'default',
    data: {
      url: data.url || '/',
      roomId: data.roomId,
    },
    vibrate: [100, 50, 100],
  } satisfies NotificationOptions & { vibrate?: number[] }

  event.waitUntil(
    self.registration.showNotification(data.title || 'Night Whispers', options)
  )
})

// Notification click handler - open app to relevant chat
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close()

  const url = event.notification.data?.url || '/'

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(windowClients => {
        // Focus existing window if open
        for (const client of windowClients) {
          if (client.url.includes(url) && 'focus' in client) {
            return client.focus()
          }
        }
        // Otherwise open new window
        return self.clients.openWindow(url)
      })
  )
})
