# Phase 2: Session & Room Entry - Research

**Researched:** 2026-01-19
**Domain:** Supabase anonymous authentication, session management, mobile reconnection
**Confidence:** HIGH

## Summary

This phase implements user session management using Supabase anonymous authentication with localStorage persistence, room creation/joining with 4-letter codes, and mobile-first reconnection handling. The standard approach leverages Supabase's built-in session management with automatic token refresh, React Router 7's loader pattern for protected routes, and Mantine's useForm for validation.

Anonymous auth creates real authenticated users (not the anon API key) that persist across browser refreshes via localStorage. Sessions use short-lived JWTs (1 hour default) with refresh tokens that auto-renew. The primary mobile challenge is iOS WebKit's 7-day cap on localStorage, which can clear sessions unexpectedly - requiring robust session validation on every app load.

**Primary recommendation:** Use `supabase.auth.getSession()` + `onAuthStateChange()` in root useEffect for session recovery, nanoid's customAlphabet for collision-resistant 4-letter codes, and database unique constraints with upsert to prevent duplicate participants on reconnection.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | 2.90.0 | Auth, database, realtime | Official Supabase client, handles session mgmt automatically |
| nanoid | 5.0.0 | Room code generation | Cryptographically strong, customizable alphabet, tiny (118 bytes) |
| @mantine/form | 8.3.0 | Form validation | Built-in validators, mobile-friendly, matches UI library |
| react-router | 7.12.0 | Navigation & protected routes | Latest with CVE-2026-22029 fix, loader pattern for auth checks |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @mantine/hooks | 8.3.0 | useLocalStorage, useWindowEvent | App lifecycle events (mobile background/foreground) |
| @mantine/notifications | 8.3.0 | Error feedback | Session expiry, invalid room codes, connection errors |
| zustand | 5.0.0 | Global session state | Share auth state across components efficiently |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| nanoid customAlphabet | crypto.randomInt loop | nanoid is battle-tested, crypto requires manual collision detection |
| Supabase anonymous auth | Email magic links | Anonymous is faster UX, no email required for ephemeral games |
| localStorage | sessionStorage | sessionStorage clears on tab close, breaks reconnection requirement |

**Installation:**
All dependencies already in package.json (verified).

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   ├── supabase.ts          # Already exists
│   └── room-codes.ts         # Room code generation utilities
├── hooks/
│   ├── useAuth.ts            # Session recovery + auth state
│   └── useRoom.ts            # Room join/create logic
├── pages/
│   ├── HomePage.tsx          # Entry point (create/join choice)
│   ├── SessionSetupPage.tsx  # Display name + avatar selection
│   ├── CreateRoomPage.tsx    # Storyteller creates room
│   ├── JoinRoomPage.tsx      # Player enters 4-letter code
│   └── RoomPage.tsx          # Main game interface (protected)
└── components/
    └── AvatarSelector.tsx    # Grid of pre-made avatars
```

### Pattern 1: Session Recovery on App Load
**What:** Check for existing Supabase session on mount, set up auth state listener
**When to use:** Root App component, runs once per app load
**Example:**
```typescript
// Source: https://supabase.com/docs/guides/auth/quickstarts/react
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1. Check for existing session (from localStorage)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // 2. Listen for auth changes (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return { session, loading }
}
```

### Pattern 2: Create Anonymous Session
**What:** Sign in anonymously only if no session exists
**When to use:** First-time visitors, session expired/cleared
**Example:**
```typescript
// Source: https://supabase.com/docs/guides/auth/auth-anonymous
async function createAnonymousSession() {
  // CRITICAL: Check if already signed in to avoid duplicate users
  const { data: { session } } = await supabase.auth.getSession()
  if (session) {
    return session
  }

  // Create new anonymous user
  const { data, error } = await supabase.auth.signInAnonymously()
  if (error) throw error
  return data.session
}
```

### Pattern 3: Protected Route with Auto-Redirect
**What:** Use React Router loader to verify session before rendering
**When to use:** Room page, any route requiring authentication
**Example:**
```typescript
// Source: https://reactrouter.com/en/main/route/loader
import { redirect } from 'react-router'

export async function roomLoader({ params }: LoaderFunctionArgs) {
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    // Redirect to home if no session
    return redirect('/')
  }

  // Verify user is participant in this room
  const { data: participant, error } = await supabase
    .from('participants')
    .select('*')
    .eq('room_id', params.roomId)
    .eq('user_id', session.user.id)
    .single()

  if (error || !participant) {
    // Session expired or user kicked from room
    return redirect('/?error=session-invalid')
  }

  return { participant }
}
```

### Pattern 4: Room Code Generation
**What:** Generate collision-resistant 4-letter codes using nanoid
**When to use:** Storyteller creates new room
**Example:**
```typescript
// Source: https://github.com/ai/nanoid
import { customAlphabet } from 'nanoid'

// Exclude confusing characters: I/1, O/0
const generateRoomCode = customAlphabet(
  'ABCDEFGHJKLMNPQRSTUVWXYZ23456789',
  4
)

async function createRoom() {
  const code = generateRoomCode() // e.g., "T7XK"

  // Insert with retry logic for rare collisions
  const { data, error } = await supabase
    .from('rooms')
    .insert({ code })
    .select()
    .single()

  if (error?.code === '23505') { // Unique constraint violation
    // Collision occurred, retry with new code
    return createRoom()
  }

  return data
}
```

### Pattern 5: Upsert Participant to Prevent Duplicates
**What:** Use database unique constraint + upsert for reconnection
**When to use:** User joins/rejoins room
**Example:**
```typescript
// Source: https://medium.com/@padmagnanapriya/handling-record-duplication-issues-in-postgresql-upsert-queries
async function joinRoom(roomId: string, displayName: string, avatar: string) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not authenticated')

  // Upsert: insert if new, update if exists (prevents duplicates)
  const { data, error } = await supabase
    .from('participants')
    .upsert(
      {
        room_id: roomId,
        user_id: session.user.id,
        display_name: displayName,
        avatar: avatar,
        joined_at: new Date().toISOString()
      },
      { onConflict: 'room_id,user_id' } // Composite unique constraint
    )
    .select()
    .single()

  if (error) throw error
  return data
}
```

### Pattern 6: Mobile App Lifecycle Handling
**What:** Reconnect Realtime when app returns from background
**When to use:** Mobile web apps using Supabase Realtime
**Example:**
```typescript
// Source: https://github.com/supabase/realtime/issues/121
import { useEffect } from 'react'

export function useRealtimeLifecycle(channel: RealtimeChannel | null) {
  useEffect(() => {
    if (!channel) return

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        // App returned to foreground
        if (channel.state === 'closed') {
          channel.subscribe()
        }
      } else {
        // App went to background (optional: unsubscribe to save battery)
        // channel.unsubscribe()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [channel])
}
```

### Pattern 7: Mantine Form Validation
**What:** Validate display name and avatar selection
**When to use:** Session setup form
**Example:**
```typescript
// Source: https://mantine.dev/form/use-form/
import { useForm } from '@mantine/form'
import { isNotEmpty, hasLength } from '@mantine/form'

const form = useForm({
  mode: 'uncontrolled',
  initialValues: {
    displayName: '',
    avatar: ''
  },
  validate: {
    displayName: hasLength(
      { min: 2, max: 20 },
      'Name must be 2-20 characters'
    ),
    avatar: isNotEmpty('Please select an avatar')
  }
})
```

### Anti-Patterns to Avoid
- **Multiple signInAnonymously() calls:** Creates duplicate users. Always check `getSession()` first.
- **Storing session in component state only:** Session lost on refresh. Let Supabase manage localStorage.
- **Ignoring session expiry errors:** User sees broken UI. Redirect to home with clear error message.
- **Manual WebSocket reconnection:** Supabase client handles this automatically with exponential backoff.
- **Using sessionStorage for tokens:** Clears on tab close, breaks SESS-04 auto-rejoin requirement.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Session persistence | Custom localStorage wrapper | Supabase `persistSession: true` (default) | Handles encryption, expiry, refresh token rotation, security updates |
| Token refresh | setInterval to refresh JWT | Supabase auto-refresh (default) | Handles clock skew, refresh token reuse detection, 10s reuse window |
| Auth state management | useState + localStorage sync | `supabase.auth.onAuthStateChange()` | Fires on sign in, sign out, token refresh, tab sync |
| Room code collision handling | Check existence then insert | Database unique constraint + retry | Prevents race conditions, database enforces uniqueness |
| Form validation | Custom regex + error state | Mantine `useForm` validators | Accessibility (ARIA), mobile-friendly, built-in error display |
| Avatar selection UI | Custom grid + state | Mantine Grid + Radio/Checkbox | Keyboard navigation, mobile touch, accessible labels |
| Protected routes | Conditional rendering in component | React Router loader + redirect | Prevents flash of content, SEO-safe, blocks child loaders |

**Key insight:** Supabase session management is production-hardened with security features (refresh token rotation, reuse detection, PKCE flow) that are complex to replicate correctly. Bugs in custom auth lead to security vulnerabilities.

## Common Pitfalls

### Pitfall 1: iOS localStorage Deletion (7-Day Cap)
**What goes wrong:** User's session disappears after 7 days on iOS Safari due to WebKit's Intelligent Tracking Prevention, even though Supabase sessions don't actually expire.
**Why it happens:** WebKit enforces a 7-day cap on all script-writable storage to prevent tracking. This affects Safari and all iOS browsers (until iOS 17.4+ in EU).
**How to avoid:**
- Always validate session on app load with `getSession()` + `onAuthStateChange()`
- Don't assume session exists, even if user was "logged in"
- Show friendly "Session expired, please rejoin" message, not generic error
- Consider storing room_id separately to enable easy re-entry
**Warning signs:** User reports "kicked out" on iOS after days of inactivity, works fine on Android.

### Pitfall 2: Duplicate Anonymous Users on Rapid Reloads
**What goes wrong:** User refreshes page quickly, `getSession()` returns null, `signInAnonymously()` creates new user before localStorage hydration completes.
**Why it happens:** `getSession()` is async, but localStorage read can lag on slow devices. Race condition between session check and sign-in call.
**How to avoid:**
- Show loading state until `getSession()` resolves
- Never call `signInAnonymously()` until session check completes
- Use `loading` state to prevent duplicate calls
**Warning signs:** Database shows multiple anonymous users with same participant metadata, user_id changes on refresh.

### Pitfall 3: Room Code Collisions at Scale
**What goes wrong:** Two users create rooms simultaneously, get same 4-letter code.
**Why it happens:** 4-letter codes from 32-char alphabet = 1,048,576 combinations. Birthday paradox: 50% collision chance after ~1,000 rooms.
**How to avoid:**
- Add unique constraint on rooms.code column (should already exist from Phase 1)
- Implement retry logic in createRoom() for 23505 error (unique violation)
- Consider expiring old room codes (cleanup job for inactive rooms)
- Monitor collision rate; if >1% of creates retry, increase code length to 5
**Warning signs:** Error logs show "duplicate key value violates unique constraint" on room creation.

### Pitfall 4: Realtime Connection Drops on Mobile Background
**What goes wrong:** User backgrounds app, WebSocket connection closes, messages stop arriving. When user returns, no reconnection happens.
**Why it happens:** Mobile browsers suspend JavaScript when tab inactive. Realtime client's heartbeat timer pauses, connection times out server-side.
**How to avoid:**
- Supabase client auto-reconnects with exponential backoff (1s, 2s, 5s, 10s)
- Use Page Visibility API to detect when app returns to foreground
- Optional: Manually trigger channel.subscribe() on visibility change if state is 'closed'
- Don't unsubscribe on background (client handles it)
**Warning signs:** User reports "messages don't appear until I refresh," happens only on mobile.

### Pitfall 5: Flash of Unauthenticated Content (FOUC)
**What goes wrong:** Protected route briefly shows "Not authorized" before redirecting to home.
**Why it happens:** Component renders before loader redirect completes, or using conditional rendering instead of loader pattern.
**How to avoid:**
- Use React Router loader for auth checks, not useEffect in component
- Return `redirect('/')` from loader, don't throw or render fallback
- Show loading skeleton while loader runs
- React Router middleware short-circuits child loaders if parent redirects
**Warning signs:** User sees flash of room content before redirect, Lighthouse flags layout shift.

### Pitfall 6: Expired Session Not Detected Until RLS Error
**What goes wrong:** User stays on page, session expires after 1 hour, next database query fails with "permission denied" instead of "session expired."
**Why it happens:** Client doesn't proactively check session validity, RLS rejects query with generic error.
**How to avoid:**
- Supabase client auto-refreshes tokens before expiry (default behavior)
- Handle RLS errors gracefully: if 403 error, check `getSession()`, redirect if null
- `onAuthStateChange()` fires on TOKEN_REFRESHED event
- Don't disable autoRefreshToken (enabled by default)
**Warning signs:** Error logs show "permission denied for table X" instead of auth errors.

### Pitfall 7: React Router Open Redirect (CVE-2026-22029)
**What goes wrong:** Attacker crafts URL with `javascript:` scheme redirect, executes XSS on client.
**Why it happens:** React Router <7.12.0 and @remix-run/router <1.23.2 don't validate redirect protocol.
**How to avoid:**
- Use react-router ^7.12.0 (package.json shows 7.12.0 ✓)
- Never construct redirect URLs from untrusted input
- Validate redirect parameter if using ?redirect= query param
**Warning signs:** Security scanner flags CVE-2026-22029, router version <7.12.0.

## Code Examples

Verified patterns from official sources:

### Session Recovery Hook (Root App Component)
```typescript
// Source: https://supabase.com/docs/guides/auth/quickstarts/react
import { useEffect, useState } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Initial session recovery from localStorage
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Listen for changes (sign in, sign out, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  return { session, loading }
}
```

### Room Code Generator
```typescript
// Source: https://github.com/ai/nanoid
import { customAlphabet } from 'nanoid'

// Exclude visually similar: I/1, O/0, L/1
// 32 characters, 4 positions = 1,048,576 combinations
export const generateRoomCode = customAlphabet(
  'ABCDEFGHJKLMNPQRSTUVWXYZ23456789',
  4
)

// Usage:
const code = generateRoomCode() // "T7XK"
```

### Create Room with Collision Retry
```typescript
async function createRoom(storytellerId: string): Promise<Room> {
  const code = generateRoomCode()

  const { data, error } = await supabase
    .from('rooms')
    .insert({ code, last_activity: new Date().toISOString() })
    .select()
    .single()

  // Unique constraint violation - collision occurred
  if (error?.code === '23505') {
    return createRoom(storytellerId) // Retry with new code
  }

  if (error) throw error

  // Add storyteller as participant
  await supabase.from('participants').insert({
    room_id: data.id,
    user_id: storytellerId,
    is_storyteller: true,
    role: 'storyteller'
  })

  return data
}
```

### Upsert Participant (Reconnection-Safe)
```typescript
// Source: https://www.dbvis.com/thetable/sql-upsert-inserting-a-record-if-it-does-not-exist/
async function joinRoom(
  roomId: string,
  userId: string,
  displayName: string,
  avatar: string
) {
  const { data, error } = await supabase
    .from('participants')
    .upsert(
      {
        room_id: roomId,
        user_id: userId,
        display_name: displayName,
        avatar: avatar,
        joined_at: new Date().toISOString()
      },
      {
        onConflict: 'room_id,user_id',
        ignoreDuplicates: false // Update existing record
      }
    )
    .select()
    .single()

  if (error) throw error
  return data
}
```

### Protected Route Loader
```typescript
// Source: https://reactrouter.com/en/main/route/loader
import { redirect, LoaderFunctionArgs } from 'react-router'
import { supabase } from './lib/supabase'

export async function roomLoader({ params }: LoaderFunctionArgs) {
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return redirect('/?error=no-session')
  }

  // Verify user is participant in this room
  const { data: participant } = await supabase
    .from('participants')
    .select('*, rooms(*)')
    .eq('room_id', params.roomId)
    .eq('user_id', session.user.id)
    .single()

  if (!participant) {
    return redirect('/?error=not-participant')
  }

  return { participant }
}
```

### Mantine Form Validation
```typescript
// Source: https://mantine.dev/form/use-form/
import { useForm } from '@mantine/form'
import { hasLength, isNotEmpty } from '@mantine/form'

const form = useForm({
  mode: 'uncontrolled',
  initialValues: {
    displayName: '',
    avatar: ''
  },
  validate: {
    displayName: hasLength(
      { min: 2, max: 20 },
      'Name must be 2-20 characters'
    ),
    avatar: isNotEmpty('Please select an avatar')
  }
})

// Usage in component:
<form onSubmit={form.onSubmit(handleSubmit)}>
  <TextInput
    label="Display Name"
    placeholder="Enter your name"
    key={form.key('displayName')}
    {...form.getInputProps('displayName')}
  />
</form>
```

### Mobile Visibility Reconnection
```typescript
// Source: https://github.com/supabase/realtime-js/issues/121
import { useEffect } from 'react'
import { RealtimeChannel } from '@supabase/supabase-js'

export function useRealtimeLifecycle(channel: RealtimeChannel | null) {
  useEffect(() => {
    if (!channel) return

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        // Reconnect if connection was closed
        if (channel.state === 'closed') {
          channel.subscribe()
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [channel])
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Email auth for all users | Anonymous auth for ephemeral sessions | Feb 2023 | Faster onboarding, no email collection, better UX for casual games |
| Manual token refresh with setInterval | Auto-refresh with refresh token rotation | Supabase v2 (2022) | Eliminates clock skew issues, prevents token theft via reuse detection |
| sessionStorage for sessions | localStorage with 7-day awareness | iOS WebKit ITP (2020) | Requires iOS-specific handling, can't rely on "forever" persistence |
| React Router v5 render-based protection | v7 loader-based protection | React Router v7 (2024) | Prevents FOUC, SEO-safe, short-circuits child loaders |
| Custom ID generation | nanoid with customAlphabet | nanoid v3+ (2021) | Smaller bundle (118 bytes), cryptographically secure, customizable |

**Deprecated/outdated:**
- **`supabase.auth.session()`**: Removed in v2, use `getSession()` instead
- **httpOnly cookies in browser**: Supabase uses localStorage by default (cookies optional for SSR)
- **`signUp()` for anonymous users**: Use `signInAnonymously()` instead
- **React Router `<Redirect>`**: Use `redirect()` function in loaders (v7+)

## Open Questions

Things that couldn't be fully resolved:

1. **Optimal room code expiry policy**
   - What we know: 4-letter codes have 1M combinations, 50% collision at ~1K active rooms
   - What's unclear: What's the ideal inactive room cleanup interval? 24 hours? 7 days?
   - Recommendation: Start with 24-hour cleanup for rooms with last_activity > 24h ago. Monitor collision rate in logs. If >1% of creates hit collision, either reduce cleanup interval or increase code length to 5 characters.

2. **Avatar asset strategy**
   - What we know: Need pre-made avatar set for UX-02 (mobile-first)
   - What's unclear: Should avatars be emoji, SVG icons, or image files? How many avatars?
   - Recommendation: Use emoji avatars (🧙‍♂️🧛‍♀️🧟‍♂️ etc.) for Phase 2 - zero assets to load, accessible, mobile-friendly. Can upgrade to custom SVG in later phase if needed. Provide 8-12 distinct emoji options.

3. **Realtime message delivery guarantees**
   - What we know: Supabase Realtime "does not guarantee that every message will be delivered"
   - What's unclear: How often do messages drop? Is this acceptable for chat?
   - Recommendation: For Phase 2, use Broadcast for real-time feel. If message reliability becomes issue in testing, fall back to database + Postgres Changes for critical messages. Document known limitation.

4. **Session validation frequency**
   - What we know: Auto-refresh happens before token expiry (1 hour default)
   - What's unclear: Should we validate session on every route change? Or trust auto-refresh?
   - Recommendation: Trust auto-refresh for now. Add session validation to roomLoader only. If RLS errors occur frequently, add global error boundary that checks session validity on any 403 error.

## Sources

### Primary (HIGH confidence)
- Supabase Auth Documentation - Anonymous Sign-ins: https://supabase.com/docs/guides/auth/auth-anonymous
- Supabase Auth Documentation - Sessions: https://supabase.com/docs/guides/auth/sessions
- Supabase JavaScript API Reference: https://supabase.com/docs/reference/javascript/auth-api
- Supabase Realtime Broadcast: https://supabase.com/docs/guides/realtime/broadcast
- React Router Documentation: https://reactrouter.com/en/main/route/loader
- Mantine useForm Documentation: https://mantine.dev/form/use-form/
- nanoid GitHub Repository: https://github.com/ai/nanoid

### Secondary (MEDIUM confidence)
- Supabase Anonymous Auth Discussion #31224: https://github.com/orgs/supabase/discussions/31224
- Supabase Realtime Reconnection Issue #1088: https://github.com/supabase/realtime/issues/1088
- PostgreSQL Upsert Guide (Medium): https://medium.com/@padmagnanapriya/handling-record-duplication-issues-in-postgresql-upsert-queries
- WebSocket Mobile Reconnection Issues: https://github.com/supabase/realtime-js/issues/121
- React Router CVE-2026-22029: https://github.com/remix-run/react-router/security/advisories/GHSA-2w69-qvjg-hvjx
- Short Unique ID Documentation: https://shortunique.id/
- localStorage Security Best Practices: https://www.pivotpointsecurity.com/local-storage-versus-cookies-which-to-use-to-securely-store-session-tokens

### Tertiary (LOW confidence - community sources)
- WebSocket Background Tab Behavior: https://www.xjavascript.com/blog/how-do-i-recover-from-a-websocket-client-computer-going-to-sleep-or-app-going-to-background-safari-on-ipad/
- iOS localStorage Deletion Article (Medium): https://dmihal.medium.com/apple-just-killed-local-storage-what-that-means-for-burner-wallets-412d49a71485
- React Form Validation Best Practices: https://formspree.io/blog/react-form-validation/

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified in package.json, official docs reviewed
- Architecture: HIGH - Patterns extracted from official Supabase + React Router docs
- Pitfalls: MEDIUM - iOS localStorage issue verified, others based on documented GitHub issues
- Mobile reconnection: MEDIUM - Based on Supabase Realtime issues and WebSocket behavior articles

**Research date:** 2026-01-19
**Valid until:** 2026-02-18 (30 days - stable ecosystem)
