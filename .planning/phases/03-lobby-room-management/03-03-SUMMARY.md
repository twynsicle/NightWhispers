---
phase: 03-lobby-room-management
plan: 03
subsystem: ui
tags: [qrcode, supabase-edge-functions, deno, room-sharing, cleanup]

# Dependency graph
requires:
  - phase: 02-session-room-entry
    provides: RoomPage component, room code display, session management
  - phase: 01-foundation
    provides: Database schema with expires_at field, Supabase client
provides:
  - QR code generation for room sharing
  - Room cleanup automation via Edge Function
  - Improved UX for in-person game nights (scan to join)
affects: [03-lobby-room-management (remaining plans), database-maintenance]

# Tech tracking
tech-stack:
  added: [qrcode, @types/qrcode, Supabase Edge Functions (Deno)]
  patterns: [QR code generation with theme colors, Edge Function for scheduled tasks, Modal-based sharing UI]

key-files:
  created:
    - src/components/QRCodeGenerator.tsx
    - supabase/functions/cleanup-expired-rooms/index.ts
  modified:
    - src/pages/RoomPage.tsx

key-decisions:
  - "QR code colors match gothic theme (crimson for dark pixels, dark.9 for background)"
  - "Join URL includes pre-filled room code query param for better UX"
  - "QR code modal available to all participants (not just Storyteller)"
  - "Edge Function uses service role key to bypass RLS for admin deletion"
  - "Edge Function deployed but not scheduled - requires external scheduler setup"

patterns-established:
  - "QR code generation pattern: useEffect with data URL state, loading skeleton, copy button"
  - "Modal pattern for sharing features: centered, titled, close button"
  - "Edge Function pattern: service role client, error handling, logging, JSON responses"

# Metrics
duration: 3m 40s
completed: 2026-01-20
---

# Phase 3 Plan 3: QR Code Sharing & Room Cleanup Summary

**QR code generator with gothic theme colors for room sharing, plus automated room cleanup Edge Function for database maintenance**

## Performance

- **Duration:** 3 minutes 40 seconds
- **Started:** 2026-01-20T03:35:00Z
- **Completed:** 2026-01-20T03:38:40Z
- **Tasks:** 3
- **Files modified:** 3 (created 2, modified 1)

## Accomplishments
- QR code generation component with clipboard copy functionality
- Modal-based QR code sharing integrated into RoomPage for all participants
- Supabase Edge Function for automated deletion of expired rooms
- Pre-filled join URL query parameter for seamless scan-to-join experience

## Task Commits

Each task was committed atomically:

1. **Task 1: Create QR code generator component** - `fb9f8f7` (feat)
   - Installed qrcode library and TypeScript types
   - Created QRCodeGenerator component with gothic theme colors
   - Implemented loading state, error handling, clipboard copy

2. **Task 2: Add QR code modal to RoomPage** - `9bfaaaf` (feat)
   - Integrated QRCodeGenerator into RoomPage
   - Added "Show QR Code" button and modal
   - Constructed join URL with pre-filled room code query param

3. **Task 3: Create room cleanup Edge Function** - `889e41c` (feat)
   - Created Supabase Edge Function for expired room deletion
   - Service role key bypasses RLS for admin operations
   - Cascading deletes remove participants and messages

**Plan metadata:** (will be added in final commit)

## Files Created/Modified

### Created
- **src/components/QRCodeGenerator.tsx** - QR code generation component with gothic theme colors (crimson for dark pixels, dark.9 for background), loading skeleton, copy to clipboard functionality
- **supabase/functions/cleanup-expired-rooms/index.ts** - Edge Function that deletes rooms where expires_at < now(), with cascading participant/message cleanup

### Modified
- **src/pages/RoomPage.tsx** - Added QR code modal with "Show QR Code" button, constructs join URL with pre-filled room code query parameter

## Decisions Made

1. **QR code colors match gothic theme** - Used crimson (#c92a2a) for dark pixels and dark.9 (#1a1b1e) for background to maintain visual consistency with Night Whispers aesthetic

2. **Join URL includes pre-filled room code** - QR code encodes `/join?code=XXXX` instead of just `/join`, allowing users to proceed directly to session setup after scanning without manual code entry

3. **QR code modal available to all participants** - Both Storytellers and Players can show the QR code, enabling flexible sharing scenarios (e.g., players showing code to latecomers)

4. **Edge Function uses service role key** - Bypasses RLS policies for admin-level deletion operations, necessary for automated cleanup

5. **Edge Function deployed but not scheduled** - Requires external scheduler setup (pg_cron, Vercel Cron, or GitHub Actions) - documented in verification section

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all tasks completed without issues.

## User Setup Required

**External scheduler configuration required for room cleanup automation.**

The Edge Function is deployed but requires scheduling to run hourly. Choose one option:

### Option 1: pg_cron (Supabase native)
```sql
SELECT cron.schedule(
  'cleanup-expired-rooms',
  '0 * * * *', -- Every hour at :00
  $$SELECT net.http_post(
    url := 'https://PROJECT_REF.supabase.co/functions/v1/cleanup-expired-rooms',
    headers := '{"Authorization": "Bearer SERVICE_ROLE_KEY"}'::jsonb
  )$$
);
```

### Option 2: Vercel Cron (if using Vercel deployment)
Create `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cleanup-rooms",
    "schedule": "0 * * * *"
  }]
}
```

### Option 3: GitHub Actions (free, works anywhere)
Create `.github/workflows/cleanup-rooms.yml` with hourly cron trigger.

### Manual Testing
Deploy and test the function:
```bash
npx supabase functions deploy cleanup-expired-rooms
npx supabase functions invoke cleanup-expired-rooms
```

## Next Phase Readiness

**Ready for remaining Phase 3 plans:**
- QR code sharing enables easy room joining for in-person groups
- Room cleanup prevents database bloat from abandoned rooms
- Modal pattern established for future sharing features

**No blockers or concerns.**

**Next:** Continue with remaining Phase 3 plans (participant list, lobby UI, room controls).

---
*Phase: 03-lobby-room-management*
*Completed: 2026-01-20*
