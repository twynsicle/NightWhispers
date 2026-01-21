---
phase: 06-polish-pwa
plan: 04
subsystem: notifications
tags: [push-notifications, web-push, vapid, edge-functions, service-worker]

# Dependency graph
requires:
  - phase: 06-01
    provides: PWA configuration, service worker setup, isPWAInstalled utility
provides:
  - Push subscription database table (push_subscriptions)
  - Edge Function for push delivery (send-push)
  - Push subscription management hook (usePushNotifications)
  - Push notification prompt UI component
  - Service worker push event handling
affects: []

# Tech tracking
tech-stack:
  added: ["@negrel/webpush (Edge Function)", "Web Push API"]
  patterns: [VAPID authentication, Push subscription management, Edge Function push delivery]

key-files:
  created:
    - supabase/migrations/006_push_subscriptions.sql
    - supabase/functions/send-push/index.ts
    - src/lib/push-subscription.ts
    - src/hooks/usePushNotifications.ts
    - src/components/PushNotificationPrompt.tsx
    - src/sw.ts
  modified:
    - src/pages/RoomPage.tsx
    - vite.config.ts
    - src/hooks/useMessages.ts

key-decisions:
  - "VAPID keys via environment variables for security"
  - "@negrel/webpush library for Deno Edge Functions"
  - "injectManifest strategy for custom service worker with push handling"
  - "Push subscription stored per participant (not per user)"
  - "iOS PWA detection guides users to install before enabling push"

patterns-established:
  - "Push subscription: subscribe -> save to DB -> use for delivery"
  - "Edge Function push: receive subscription + payload -> @negrel/webpush -> push service"
  - "Service worker: push event -> showNotification, notificationclick -> openWindow"

# Metrics
duration: 35min
completed: 2026-01-20
---

# Phase 6 Plan 4: Push Notifications Summary

**Web Push notifications with VAPID authentication, Edge Function delivery, and iOS PWA guidance for backgrounded message alerts**

## Performance

- **Duration:** 35 min
- **Started:** 2026-01-20
- **Completed:** 2026-01-20
- **Tasks:** 3
- **Files created:** 6
- **Files modified:** 3

## Accomplishments

- Push subscription database table with RLS policies for participant-scoped access
- Edge Function using @negrel/webpush for VAPID-signed push delivery
- usePushNotifications hook for state management (unsupported/prompt/subscribed/denied/pwa-required)
- PushNotificationPrompt component with iOS PWA installation guidance
- Custom service worker with push event and notificationclick handlers
- Integration with RoomPage to show notification prompt on game start
- Push notifications trigger on new message receipt when app backgrounded

## Task Commits

Each task was committed atomically:

1. **Task 1: Create push subscription database and Edge Function** - `8c10742` (feat)
2. **Task 2: Create push subscription hook and utilities** - `aaefefe` (feat)
3. **Task 3: Create push notification UI and integrate** - `e583ed9` (feat)

## Additional Fixes

Post-checkpoint fixes were applied:

- `0d9f264` - Supabase fixes for push notification configuration
- `2425c54` - Fix push notification not displaying for players

## Files Created/Modified

### Created
- `supabase/migrations/006_push_subscriptions.sql` - Push subscription table with RLS policies
- `supabase/functions/send-push/index.ts` - Edge Function for push delivery via @negrel/webpush
- `src/lib/push-subscription.ts` - Push utilities (subscribeToPush, savePushSubscription, sendPushNotification)
- `src/hooks/usePushNotifications.ts` - Hook for push state management and subscription lifecycle
- `src/components/PushNotificationPrompt.tsx` - UI for requesting notification permission
- `src/sw.ts` - Custom service worker with push and notificationclick event handlers

### Modified
- `vite.config.ts` - Changed to injectManifest strategy for custom service worker
- `src/pages/RoomPage.tsx` - Added PushNotificationPrompt to active game view
- `src/hooks/useMessages.ts` - Integrated push notification delivery on new messages

## Decisions Made

- **VAPID keys via environment** - VITE_VAPID_PUBLIC_KEY for client, secrets for Edge Function
- **@negrel/webpush library** - Deno-compatible Web Push library for Edge Functions
- **injectManifest strategy** - Required for custom service worker with push handling (vs generateSW)
- **Per-participant subscriptions** - Subscription tied to participant_id, not user_id (room-scoped)
- **iOS PWA detection** - Show "Add to Home Screen" guidance when push unavailable on iOS browser

## Deviations from Plan

None - plan executed as written. Post-checkpoint fixes addressed:

1. **Supabase configuration** - Additional configuration needed for Edge Function deployment
2. **Player notification display** - Fixed issue where players weren't receiving push notifications

## User Setup Required

Checkpoint required manual user actions:

1. Generate VAPID keys: `npx web-push generate-vapid-keys`
2. Set Supabase secrets: `supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=...`
3. Set client env var: `VITE_VAPID_PUBLIC_KEY` in .env
4. Deploy Edge Function: `supabase functions deploy send-push`
5. Apply migration: `supabase db push`

**User verified:** Push notifications working correctly after setup.

## Success Criteria Met

- [x] PUSH-01: App requests notification permission on game start
- [x] PUSH-02: User receives push notification when new message arrives (app backgrounded)
- [x] PUSH-03: Notification tap opens app to relevant chat
- [x] iOS users see PWA installation guidance when push unavailable

## Next Phase Readiness

- Push notification infrastructure complete
- All Phase 6 plans complete (06-01, 06-02, 06-03, 06-04, 06-05)
- Project ready for final testing and deployment

---
*Phase: 06-polish-pwa*
*Completed: 2026-01-20*
