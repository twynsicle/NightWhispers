# Phase 6: Polish & PWA - Research

**Researched:** 2026-01-20
**Domain:** PWA, Push Notifications, Responsive Desktop Layout, Drag-and-Drop, Animations
**Confidence:** MEDIUM (some areas well-documented, others have React 19 compatibility concerns)

## Summary

Phase 6 transforms the mobile-first Night Whispers app into a polished, installable PWA with desktop optimization. Research covers five key domains: PWA setup with vite-plugin-pwa (already installed), web push notifications via Supabase Edge Functions, desktop split-panel layouts, drag-and-drop for player card reordering, and smooth animations.

The project already has `vite-plugin-pwa` ^1.2.0 installed but not configured. PWA setup is straightforward with good documentation. **Push notifications on iOS require the app to be installed to Home Screen** with `display: standalone` in the manifest - this is a hard requirement from Apple. For drag-and-drop, **dnd-kit** is the recommended library but has maintenance concerns and potential React 19 compatibility issues - recommend using `@dnd-kit/core` (stable) rather than the experimental `@dnd-kit/react`. Animations can leverage Mantine's built-in Transition component for most needs, with Motion (framer-motion v12+) for complex gestures.

**Primary recommendation:** Prioritize PWA installability and desktop layout before push notifications. iOS push requires Home Screen installation, so the app install flow should be optimized first.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| vite-plugin-pwa | ^1.2.0 | PWA manifest & service worker | Already installed, zero-config with Vite |
| @dnd-kit/core | ^6.3.1 | Drag-and-drop framework | Modern, accessible, modular |
| @dnd-kit/sortable | ^8.0.0 | Sortable list preset | Built on core, handles reordering |
| motion | ^12.26.0 | Advanced animations | React 19 compatible, framer-motion successor |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @dnd-kit/utilities | ^3.2.2 | CSS transform helpers | With sortable for style transforms |
| @negrel/webpush | latest | Deno web-push for Edge Functions | Server-side push delivery |
| @mantine/hooks | ^8.3.0 | useMediaQuery for breakpoints | Already installed, desktop detection |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| dnd-kit | @hello-pangea/dnd | Better for lists-only, but doesn't support grids |
| dnd-kit | pragmatic-drag-and-drop | Atlassian's new library, less community adoption |
| motion | Mantine Transition | Built-in but limited to enter/exit only |
| motion | react-spring | Physics-based, steeper learning curve |

**Installation:**
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities motion
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  components/
    desktop/              # Desktop-specific layout components
      SplitPanelLayout.tsx
      PlayerSidebar.tsx
    animations/           # Reusable animation components
      AnimatedCard.tsx
      MessageAnimation.tsx
  hooks/
    usePushNotifications.ts   # Push subscription management
    useDesktopLayout.ts       # Desktop breakpoint detection
  lib/
    push-subscription.ts      # Push subscription helpers
  sw.ts                       # Custom service worker (if injectManifest)
public/
  pwa-192x192.png            # PWA icons
  pwa-512x512.png
  apple-touch-icon.png       # 180x180 for iOS
  favicon.ico
supabase/
  functions/
    send-push/               # Edge function for push delivery
      index.ts
```

### Pattern 1: PWA Configuration with vite-plugin-pwa
**What:** Configure manifest and service worker generation
**When to use:** All PWA requirements (UX-04)
**Example:**
```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'Night Whispers',
        short_name: 'Night Whispers',
        description: 'Private Storyteller-to-player messaging for Blood on the Clocktower',
        theme_color: '#1a1b1e',  // dark.7 from Mantine
        background_color: '#141517',  // dark.8
        display: 'standalone',  // REQUIRED for iOS push
        orientation: 'portrait',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 }
            }
          }
        ]
      }
    })
  ]
})
```

### Pattern 2: Desktop Split-Panel Layout
**What:** Conditional layout based on viewport width
**When to use:** Desktop breakpoint (>1024px) per UX-03
**Example:**
```typescript
// Source: Mantine hooks documentation
import { useMediaQuery } from '@mantine/hooks'
import { em } from '@mantine/core'

function StorytellerDashboard() {
  const isDesktop = useMediaQuery(`(min-width: ${em(1024)})`)

  if (isDesktop) {
    return (
      <Group align="stretch" gap={0} wrap="nowrap" h="100vh">
        <Box w={320} style={{ borderRight: '1px solid var(--mantine-color-dark-4)' }}>
          <PlayerSidebar participants={participants} />
        </Box>
        <Box flex={1}>
          <ConversationView {...conversationProps} />
        </Box>
      </Group>
    )
  }

  // Mobile: existing card-based layout
  return <MobileStorytellerView />
}
```

### Pattern 3: Sortable Player Cards with dnd-kit
**What:** Drag-and-drop reordering of player cards
**When to use:** DASH-05 Storyteller drag-and-drop reorder
**Example:**
```typescript
// Source: dnd-kit sortable documentation
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

function SortablePlayerCard({ participant }: { participant: Participant }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: participant.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <Card ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <PlayerCardContent participant={participant} />
    </Card>
  )
}

function SortablePlayerList({ participants, onReorder }) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function handleDragEnd(event) {
    const { active, over } = event
    if (active.id !== over?.id) {
      const oldIndex = participants.findIndex(p => p.id === active.id)
      const newIndex = participants.findIndex(p => p.id === over.id)
      const reordered = arrayMove(participants, oldIndex, newIndex)
      onReorder(reordered)
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={participants.map(p => p.id)} strategy={verticalListSortingStrategy}>
        {participants.map(p => <SortablePlayerCard key={p.id} participant={p} />)}
      </SortableContext>
    </DndContext>
  )
}
```

### Pattern 4: Push Notification Subscription
**What:** Request permission and subscribe to push
**When to use:** PUSH-01 on game start
**Example:**
```typescript
// Source: Web Push API documentation + iOS requirements
async function subscribeToPush(vapidPublicKey: string): Promise<PushSubscription | null> {
  // Check if push is supported (won't be available in Safari unless Home Screen PWA)
  if (!('PushManager' in window)) {
    console.log('Push not supported - may need Home Screen installation on iOS')
    return null
  }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    return null
  }

  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
  })

  return subscription
}

// Convert VAPID key to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)))
}
```

### Pattern 5: Animations with Mantine Transition
**What:** Enter/exit animations for UI elements
**When to use:** UX-05 card expand, new messages, phase advance
**Example:**
```typescript
// Source: Mantine Transition documentation
import { Transition } from '@mantine/core'

function AnimatedMessage({ message, index }) {
  return (
    <Transition
      mounted={true}
      transition="slide-up"
      duration={200}
      timingFunction="ease-out"
      enterDelay={index * 50}  // Stagger effect
    >
      {(styles) => (
        <Paper style={styles}>
          <MessageContent message={message} />
        </Paper>
      )}
    </Transition>
  )
}

// Custom transition for card expand
const cardExpandTransition = {
  in: { opacity: 1, transform: 'scale(1)' },
  out: { opacity: 0, transform: 'scale(0.95)' },
  common: { transformOrigin: 'top center' },
  transitionProperty: 'transform, opacity',
}
```

### Anti-Patterns to Avoid
- **Push without Home Screen check on iOS:** PushManager won't exist unless installed to Home Screen
- **Using @dnd-kit/react experimental package:** Stick with @dnd-kit/core for stability
- **Heavy animations on mobile:** Keep durations short (<300ms), use CSS transforms only
- **Polling for push subscription status:** Use service worker events instead
- **Storing VAPID private key client-side:** Private key stays in Edge Function only

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Service worker generation | Custom SW from scratch | vite-plugin-pwa workbox | Handles precaching, updates, versioning |
| Web manifest | Manual manifest.json | vite-plugin-pwa manifest option | Auto-injects into HTML, type-safe |
| Drag-and-drop | Custom mouse/touch handlers | dnd-kit | Accessibility, keyboard support, edge cases |
| Push encryption | Manual VAPID signing | @negrel/webpush (Deno) | RFC 8291 compliance, key management |
| Responsive breakpoints | Manual window.matchMedia | useMediaQuery from @mantine/hooks | SSR-safe, cleanup handled |
| Animation orchestration | Manual CSS keyframes | Motion or Mantine Transition | Handles mount/unmount, interruption |

**Key insight:** Push notifications have complex encryption requirements (ECDH key exchange, AES-GCM encryption) that MUST use a library. The web-push protocol is not trivial to implement correctly.

## Common Pitfalls

### Pitfall 1: iOS Push Requires Home Screen Installation
**What goes wrong:** Push subscription fails silently on iOS Safari
**Why it happens:** `PushManager` only exists when PWA is installed to Home Screen with `display: standalone`
**How to avoid:**
1. Set `display: 'standalone'` in manifest (REQUIRED)
2. Check `'PushManager' in window` before attempting subscription
3. Show user guidance to "Add to Home Screen" if not installed
4. Use `navigator.standalone` (iOS) or `window.matchMedia('(display-mode: standalone)')` to detect
**Warning signs:** Subscription works on Android/desktop but fails on iOS

### Pitfall 2: dnd-kit React 19 Compatibility
**What goes wrong:** Errors with concurrent rendering, missing "use client" directives
**Why it happens:** dnd-kit/core hasn't been updated in over a year, React 19 changes
**How to avoid:**
1. Use `@dnd-kit/core` (stable) not `@dnd-kit/react` (experimental)
2. Wrap DndContext usage in client components explicitly
3. Test drag-and-drop thoroughly after React updates
4. Have fallback non-sortable UI if drag breaks
**Warning signs:** Hydration errors, drag state not updating

### Pitfall 3: Service Worker Update Conflicts
**What goes wrong:** Old service worker serves stale content after deploy
**Why it happens:** Service workers have complex lifecycle (install -> waiting -> active)
**How to avoid:**
1. Use `registerType: 'autoUpdate'` with `skipWaiting: true`
2. Or use `registerType: 'prompt'` and show update UI to users
3. Test update flow in production before major releases
**Warning signs:** Users report seeing old UI after deployment

### Pitfall 4: Push Subscription Endpoint Expiry
**What goes wrong:** Push notifications stop working after some time
**Why it happens:** Push subscriptions can expire, endpoints can change
**How to avoid:**
1. Store subscription in database with created_at timestamp
2. Listen for `pushsubscriptionchange` event in service worker
3. Re-subscribe and update database when subscription changes
4. Handle 410 Gone errors from push service (subscription expired)
**Warning signs:** Push worked initially, stops after days/weeks

### Pitfall 5: Animation Performance on Low-End Devices
**What goes wrong:** Janky animations, dropped frames, battery drain
**Why it happens:** JavaScript-driven animations, layout thrashing, too many animated elements
**How to avoid:**
1. Use CSS transforms only (`translate`, `scale`, `opacity`)
2. Keep durations under 300ms on mobile
3. Use `will-change` sparingly
4. Reduce motion for `prefers-reduced-motion` users
5. Limit concurrent animations to 3-5 elements
**Warning signs:** Animations smooth on desktop, janky on phone

## Code Examples

Verified patterns from official sources:

### Service Worker Push Event Handler
```typescript
// public/sw.ts or custom service worker
// Source: Web Push API MDN documentation
self.addEventListener('push', (event: PushEvent) => {
  const data = event.data?.json() ?? {}

  const options: NotificationOptions = {
    body: data.body || 'New message',
    icon: '/pwa-192x192.png',
    badge: '/badge-72x72.png',
    tag: data.tag || 'default',  // Replaces existing notification with same tag
    data: {
      url: data.url || '/',  // For notification click handling
      roomId: data.roomId,
    },
    vibrate: [100, 50, 100],  // Vibration pattern
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'Night Whispers', options)
  )
})

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close()

  const url = event.notification.data?.url || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      // Focus existing window if open
      for (const client of windowClients) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus()
        }
      }
      // Otherwise open new window
      return clients.openWindow(url)
    })
  )
})
```

### Supabase Edge Function for Push Delivery
```typescript
// supabase/functions/send-push/index.ts
// Source: @negrel/webpush documentation + Supabase Edge Functions
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import * as webpush from 'jsr:@negrel/webpush'

const vapidKeys = {
  publicKey: Deno.env.get('VAPID_PUBLIC_KEY')!,
  privateKey: Deno.env.get('VAPID_PRIVATE_KEY')!,
}

serve(async (req) => {
  const { subscription, payload } = await req.json()

  const appServer = await webpush.ApplicationServer.new({
    contactInformation: 'mailto:admin@nightwhispers.app',
    vapidKeys,
  })

  const subscriber = appServer.subscribe(subscription)

  try {
    await subscriber.pushTextMessage(JSON.stringify(payload), {})
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    // Handle expired subscription (410 Gone)
    if (error.statusCode === 410) {
      return new Response(JSON.stringify({ success: false, expired: true }), {
        status: 410,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    throw error
  }
})
```

### Detect PWA Installation State
```typescript
// Source: MDN Web App Manifest documentation
function isPWAInstalled(): boolean {
  // iOS Safari
  if ('standalone' in navigator && (navigator as any).standalone) {
    return true
  }

  // Chrome, Edge, etc.
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true
  }

  return false
}

function canSubscribeToPush(): boolean {
  // PushManager only exists if:
  // 1. Service worker is supported
  // 2. On iOS: PWA is installed to Home Screen
  return 'serviceWorker' in navigator && 'PushManager' in window
}
```

### Desktop Breakpoint Hook
```typescript
// Source: Mantine hooks documentation
import { useMediaQuery } from '@mantine/hooks'
import { em } from '@mantine/core'

export function useDesktopLayout() {
  const isDesktop = useMediaQuery(`(min-width: ${em(1024)})`, false, {
    getInitialValueInEffect: true,  // SSR-safe
  })

  return { isDesktop }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| framer-motion package | motion package | 2024 | Same API, better tree-shaking |
| react-beautiful-dnd | @hello-pangea/dnd or dnd-kit | 2022 | rbd deprecated, forks/alternatives needed |
| GCM for web push | VAPID standard | 2018 | No Google dependency, better privacy |
| Manual SW registration | vite-plugin-pwa registerSW | 2023 | Auto-generated registration script |
| iOS no push support | iOS 16.4+ push | Mar 2023 | PWAs can finally push on iOS |

**Deprecated/outdated:**
- `react-beautiful-dnd`: No longer maintained, use @hello-pangea/dnd fork or dnd-kit
- `framer-motion` package name: Still works but `motion` is the new package
- GCM sender ID for web push: VAPID is the standard, GCM deprecated
- iOS < 16.4 push workarounds: No longer needed, native support available

## Open Questions

Things that couldn't be fully resolved:

1. **dnd-kit React 19 Long-Term Stability**
   - What we know: @dnd-kit/core works but hasn't been updated in 1+ year
   - What's unclear: Will concurrent mode issues emerge in production?
   - Recommendation: Use @dnd-kit/core (not experimental @dnd-kit/react), test thoroughly, have non-sortable fallback

2. **iOS Push Notification Reliability**
   - What we know: Works on iOS 16.4+ when installed to Home Screen
   - What's unclear: Reports of notifications stopping unexpectedly
   - Recommendation: Implement pushsubscriptionchange handler, monitor delivery rates, have in-app notification fallback

3. **VAPID Key Storage for Supabase**
   - What we know: Private key must be in Edge Function environment
   - What's unclear: Best practice for key rotation
   - Recommendation: Store in Supabase secrets (`supabase secrets set VAPID_PRIVATE_KEY=...`), document key generation

4. **Push Subscription Database Schema**
   - What we know: Need to store subscription per user per device
   - What's unclear: Best approach for anonymous auth users who may get new sessions
   - Recommendation: Store with participant_id, handle re-subscription gracefully

## Sources

### Primary (HIGH confidence)
- [vite-plugin-pwa Guide](https://vite-pwa-org.netlify.app/guide/) - PWA configuration, service worker strategies
- [vite-plugin-pwa Minimal Requirements](https://vite-pwa-org.netlify.app/guide/pwa-minimal-requirements.html) - Icon sizes, manifest fields
- [Mantine Transition](https://mantine.dev/core/transition/) - Animation component API
- [Mantine useMediaQuery](https://mantine.dev/hooks/use-media-query/) - Responsive hook API
- [dnd-kit Sortable](https://docs.dndkit.com/presets/sortable) - Sortable list implementation

### Secondary (MEDIUM confidence)
- [Brainhub PWA on iOS](https://brainhub.eu/library/pwa-on-ios) - iOS limitations, Home Screen requirements
- [Web Push VAPID](https://rossta.net/blog/using-the-web-push-api-with-vapid.html) - VAPID key usage
- [Deno Web Push](https://www.negrel.dev/blog/deno-web-push-notifications/) - @negrel/webpush library
- [Motion.dev](https://motion.dev/docs/react) - Framer Motion successor for React

### Tertiary (LOW confidence)
- [dnd-kit React 19 issues](https://github.com/clauderic/dnd-kit/issues/1654) - Compatibility concerns
- GitHub discussions on iOS push reliability - Community reports, not official

## Metadata

**Confidence breakdown:**
- Standard stack: MEDIUM - PWA/Mantine well-documented, dnd-kit has maintenance concerns
- Architecture: HIGH - Patterns are established and documented
- Pitfalls: HIGH - iOS push requirements well-documented, dnd-kit issues tracked in GitHub
- Push notifications: MEDIUM - Web Push API stable, Deno library less documented

**Research date:** 2026-01-20
**Valid until:** 2026-02-20 (30 days - stable domain but iOS PWA support evolving)
