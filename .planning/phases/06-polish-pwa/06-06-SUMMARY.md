---
phase: 06-polish-pwa
plan: 06
subsystem: push-notifications
tags: [push, edge-function, notifications, gap-closure]
dependency-graph:
  requires: [06-04]
  provides: [push-message-integration]
  affects: []
tech-stack:
  added: []
  patterns: [server-side-subscription-lookup, fire-and-forget-push]
key-files:
  created: []
  modified:
    - supabase/functions/send-push/index.ts
    - src/lib/push-subscription.ts
    - src/lib/message-helpers.ts
decisions:
  - id: server-side-subscription-lookup
    choice: "Edge Function queries subscriptions with service_role (bypasses RLS)"
    why: "Client cannot query other users' push subscriptions due to RLS policies"
  - id: fire-and-forget-push
    choice: "Push delivery is async, does not block message return"
    why: "Users should see their message instantly; push can fail silently"
  - id: content-truncation
    choice: "Truncate message body to 100 chars for push notification"
    why: "Push notifications have limited display space"
metrics:
  duration: "5 minutes"
  completed: 2026-01-20
---

# Phase 6 Plan 6: Push Notification Sending (Gap Closure) Summary

**One-liner:** Server-side subscription lookup enables push notifications when messages are sent, completing the push notification integration.

## What Was Done

### Task 1: Enhanced Edge Function for Server-Side Subscription Lookup
- Added `recipientId` parameter for 1-to-1 message push delivery
- Added `roomId` parameter for broadcast push to all active room participants
- Added `excludeSenderId` to prevent sender from receiving own notification
- Created Supabase client with `service_role` key to bypass RLS
- Returns `sent/failed/expired` counts for monitoring
- Handles "no subscription" case gracefully (returns success with sent=0)

### Task 2: Added Client-Side Push Delivery Wrappers
- Created `sendPushToRecipient(recipientId, payload)` for 1-to-1 notifications
- Created `sendPushToRoom(roomId, excludeSenderId, payload)` for broadcast notifications
- Both functions delegate subscription lookup to server-side Edge Function
- Kept existing `sendPushNotification` for backward compatibility

### Task 3: Wired Push Sending into Message Flow
- Imported push functions in `message-helpers.ts`
- Added push notification call after database insert and Broadcast delivery
- 1-to-1 messages trigger `sendPushToRecipient`
- Broadcast messages trigger `sendPushToRoom` (excludes sender)
- Fire-and-forget pattern: push errors logged but don't block message return
- Content truncated to 100 chars with "..." suffix if longer

## Files Modified

| File | Change |
|------|--------|
| supabase/functions/send-push/index.ts | Added server-side subscription lookup with recipientId/roomId modes |
| src/lib/push-subscription.ts | Added sendPushToRecipient and sendPushToRoom functions |
| src/lib/message-helpers.ts | Wired push delivery into sendMessage after Broadcast |

## Decisions Made

### Server-Side Subscription Lookup
- **Choice:** Edge Function queries push_subscriptions using service_role key
- **Why:** RLS policies only allow users to see their OWN subscriptions. A Storyteller cannot query a Player's subscription from the client. Server-side lookup with service_role bypasses RLS.

### Fire-and-Forget Pattern
- **Choice:** Push delivery is async with .catch() error handling
- **Why:** Message delivery (database + Broadcast) is the primary UX. Push is supplementary for backgrounded users. Blocking on push would add latency without user-visible benefit.

### Content Truncation
- **Choice:** Truncate message body to 100 chars for notification
- **Why:** Push notifications have limited display space on mobile lockscreens. Full content available when user opens app.

## Commits

| Hash | Message |
|------|---------|
| 24090d4 | feat(06-06): enhance Edge Function for server-side subscription lookup |
| 49d63fb | feat(06-06): add client-side push delivery wrappers |
| d3f0771 | feat(06-06): wire push notifications into message flow |

## Gap Closure

This plan closes the gap identified in `06-VERIFICATION.md`:

**Before:**
- `sendPushNotification` function existed but was never called
- Users could subscribe to push notifications but would never receive them

**After:**
- `sendMessage` calls `sendPushToRecipient` for 1-to-1 messages
- `sendMessage` calls `sendPushToRoom` for broadcasts
- Server-side subscription lookup bypasses RLS constraints
- Push notifications delivered when messages are sent

## Deviations from Plan

None - plan executed exactly as written.

## Verification Performed

1. TypeScript compiles without errors: `npx tsc --noEmit`
2. Build passes: `npm run build`
3. Import exists: `sendPushToRecipient` and `sendPushToRoom` imported in message-helpers.ts
4. Functions called: Both push functions invoked in sendMessage flow
5. No client-side subscription queries for OTHER users: Only user's own subscription managed client-side

## Next Steps

- Deploy updated Edge Function: `npx supabase functions deploy send-push --no-verify-jwt`
- Test push notifications end-to-end with real devices
- Consider database trigger for backup push delivery if Edge Function invocation fails

---

*Executed: 2026-01-20*
*Duration: 5 minutes*
*Gap closure plan for 06-04 push notification integration*
