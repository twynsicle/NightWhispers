# Research Summary

**Project:** Night Whispers
**Domain:** Realtime messaging game companion app for social deduction games
**Synthesized:** 2026-01-19

---

## Stack Recommendation

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.2.x | UI framework with useOptimistic hook for chat |
| **Vite** | 7.3.x | Build tool with fast HMR |
| **TypeScript** | 5.9.x | Type safety |
| **Mantine** | 8.3.x | Mobile-first component library |
| **Supabase JS** | 2.90.x | Backend client (auth, database, realtime) |
| **Zustand** | 5.0.x | Client state (room, user, UI) |
| **TanStack Query** | 5.90.x | Server state caching |
| **React Router** | 7.12.x | Client routing |
| **vite-plugin-pwa** | 1.2.x | PWA generation with Workbox |
| **Vitest** | 4.0.x | Testing with Browser Mode |
| **nanoid** | 5.x | Room code generation |

**Environment:** Node.js 20.19+ (Node 18 EOL April 2025)

**Key Decision:** Use Supabase Broadcast for messaging (not Postgres Changes) - critical for performance at scale.

---

## Table Stakes Features

Features users expect. Missing these makes the product feel broken.

### Must Have for MVP

1. **Real-time message delivery** - Core functionality via WebSocket
2. **Room creation/joining with codes** - Zero-friction entry mechanism
3. **Session reconnection** - Handle mobile background/foreground transitions
4. **Connection status indicator** - Users must know if they're online
5. **Push notifications** - Users won't stare at screen during game
6. **Mobile-responsive UI** - Mobile-first PWA target
7. **Message persistence** - Survive page refreshes

### Should Have for MVP

8. **QR code sharing** - Fastest room sharing method
9. **Typing indicators** - Expected from modern chat
10. **Player list visibility** - Who's in the room

### Defer to v2+

- Role assignment UI (can communicate via message)
- Phase tracking (Storyteller can announce)
- Script templates
- Player notes
- Message templates

### Explicitly Avoid

- User accounts (friction killer)
- Voice/video (scope explosion)
- Media sharing (not core value)
- Full grimoire features (solved elsewhere)
- E2E encryption (overkill)

---

## Architecture Overview

### Component Structure

```
+------------------+     +-------------------+     +------------------+
|   React Client   |     |  Supabase Edge    |     |   PostgreSQL     |
|                  |     |                   |     |                  |
| - Auth Context   |<--->| - Edge Functions  |     | - rooms          |
| - Room Context   |     | - Supabase Auth   |<--->| - participants   |
| - Message State  |<--->| - PostgREST       |     | - messages       |
| - Supabase Client|<--->| - Realtime Server |     |                  |
+------------------+     +-------------------+     +------------------+
```

### Key Patterns

1. **Broadcast for Messaging** - Direct client-to-client via server, no DB load on message delivery
2. **Postgres Changes for State** - Room/participant changes (not chat messages)
3. **Single Supabase Client** - Shared via context, prevents multiple WebSocket connections
4. **RLS on All Tables** - Security foundation from day one
5. **Session Token in localStorage** - Survive page refreshes

### Data Persistence Strategy

| Data Type | Storage | Delivery |
|-----------|---------|----------|
| Messages | PostgreSQL | Broadcast (live) |
| Room state | PostgreSQL | Postgres Changes |
| Presence | Transient | Supabase Presence |
| Typing indicators | Transient | Broadcast |

### Recommended Build Order

```
Phase 1: Foundation (DB schema, RLS, client setup)
    |
Phase 2: Auth & Session (anonymous auth, session tokens)
    |
Phase 3: Room Management (create/join, participants)
    |
Phase 4: Messaging Core (broadcast, persistence) <-- Core value
    |
Phase 5: Asymmetric Views (Storyteller vs Player UI)
    |
Phase 6: Polish (reconnection, presence, push notifications)
```

---

## Critical Pitfalls to Avoid

### 1. Silent WebSocket Failures (CP-1)

**Risk:** Messages not delivered, no visible error. Game-breaking for whispers.

**Prevention:**
- Display connection status indicator (green/yellow/red)
- Monitor Supabase heartbeat (25-second intervals)
- On reconnect, re-fetch messages since last known timestamp
- Test: lock phone 60 seconds, unlock, verify state recovery

### 2. RLS Misconfiguration (CP-2)

**Risk:** Data exposed to all users OR no one can access anything. CVE-2025-48757 affected 170+ apps.

**Prevention:**
- Enable RLS on ALL tables from day one
- Create policies BEFORE any client access
- Test with anon key, NEVER service role in development
- Add RLS policy specifically for Realtime subscriptions

### 3. Mobile Background State (CP-3)

**Risk:** iOS Safari drops WebSockets after 30-60 seconds backgrounded. Player misses whispers.

**Prevention:**
- Listen to `visibilitychange` API
- Force reconnection on `visible`
- Fetch all messages since last timestamp on reconnect
- Display "reconnecting..." state during recovery

### 4. Channel Cleanup in React (SP-1)

**Risk:** Memory leak, hits 100-channel limit, realtime stops working.

**Prevention:**
```javascript
useEffect(() => {
  const channel = supabase.channel('room').subscribe();
  return () => supabase.removeChannel(channel); // CRITICAL
}, [roomId]);
```
- Use refs to handle React Strict Mode double-invoke

### 5. iOS Push Notification Requirements (MP-1)

**Risk:** Push doesn't work on iOS. Major feature gap for significant user base.

**Prevention:**
- Detect iOS and show explicit "Add to Home Screen" instructions
- Push ONLY works when PWA is installed to home screen
- Verify manifest.json has all required fields
- Have fallback: in-app notification queue

---

## Key Insights

### Roadmap Implications

**Phase 1: Foundation** - Database schema, RLS policies, Supabase client setup
- Must establish RLS patterns correctly - cannot retrofit security
- Choose Broadcast for messaging architecture decision here
- Standard Supabase patterns - minimal research needed

**Phase 2: Auth & Session** - Anonymous auth, session tokens, reconnection
- Supabase anonymous auth is well-documented
- Session token pattern must handle mobile background/foreground
- Consider `/gsd:research-phase` for mobile reconnection edge cases

**Phase 3: Room Management** - Create/join flows, participant tracking
- Straightforward CRUD with RLS
- Edge Function for room lifecycle
- Standard patterns - minimal research needed

**Phase 4: Messaging Core** - This is the differentiator
- Broadcast implementation with persistence
- Optimistic updates with rollback
- Message ordering and deduplication
- Consider `/gsd:research-phase` for race condition handling

**Phase 5: Asymmetric Views** - Storyteller sees all, players see own
- RLS policies for message visibility
- UI divergence (Storyteller dashboard vs Player chat)
- This is the core differentiator - get it right

**Phase 6: PWA & Polish** - Push notifications, offline handling
- Needs `/gsd:research-phase` for iOS PWA nuances
- Service worker caching strategy critical
- Android battery optimization considerations

### Phases Needing Research

| Phase | Research Needed | Reason |
|-------|-----------------|--------|
| Phase 2 | MAYBE | Mobile reconnection patterns |
| Phase 4 | YES | Race conditions, message ordering |
| Phase 6 | YES | iOS PWA push, caching strategies |

### Phases with Standard Patterns

| Phase | Research Status | Reason |
|-------|-----------------|--------|
| Phase 1 | SKIP | Well-documented Supabase setup |
| Phase 3 | SKIP | Standard CRUD patterns |
| Phase 5 | SKIP | RLS patterns from Phase 1 |

### Competitive Gap

No existing tool provides asymmetric real-time messaging for in-person social deduction games:
- Clocktower Online: Virtual grimoire, no in-person support
- BOTC Notes: Player-focused, no Storyteller-player communication
- Pocket Grimoire: Character reference, no messaging
- Discord: No asymmetric views, no game integration

Night Whispers owns this niche.

### Free Tier Constraints

Supabase free tier limits to watch:
- 200 concurrent connections
- 100 messages/second
- 100 channel joins/second

For games with 15+ players, plan for Pro tier or implement connection deduplication.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All technologies stable, well-documented, verified via official sources |
| Features | MEDIUM-HIGH | Domain-specific research, competitive analysis solid |
| Architecture | HIGH | Official Supabase documentation, proven patterns |
| Pitfalls | HIGH | Multiple authoritative sources, community issues documented |

### Gaps to Address

1. **iOS PWA in EU** - Regulatory issues may block push notifications (iOS 17.4+)
2. **web-push package** - Last update ~2 years ago, may need alternatives
3. **Performance at scale** - Benchmarks exist but context-dependent, need load testing

---

## Sources

### Official Documentation
- React, Vite, Mantine official docs and changelogs
- Supabase Realtime, Auth, RLS documentation
- vite-plugin-pwa documentation

### NPM Packages (verified versions)
- @supabase/supabase-js: 2.90.1
- @tanstack/react-query: 5.90.19
- zustand: 5.0.10
- react-router: 7.12.0
- vite: 7.3.1
- vitest: 4.0.17

### Community Resources
- Ably WebSocket best practices
- MagicBell PWA push notification guides
- Supabase GitHub issues for edge cases
