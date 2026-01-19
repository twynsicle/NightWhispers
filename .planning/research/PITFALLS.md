# Pitfalls Research: Night Whispers

**Domain:** Realtime messaging app (Supabase + React + PWA)
**Researched:** 2026-01-19
**Confidence:** HIGH (multiple authoritative sources)

---

## Critical Pitfalls

Mistakes that cause rewrites, major rearchitecture, or project failure.

### CP-1: Silent WebSocket Failures

**What goes wrong:** WebSocket connections fail silently. Some clients get updates, others don't. Users don't know they're missing messages because there's no visible error - the connection appears healthy but messages aren't arriving.

**Why it happens:**
- Mobile browsers aggressively disconnect WebSockets when tabs are backgrounded
- Network proxies/firewalls can silently drop connections
- Heartbeat mechanism not monitored or misconfigured
- No visual indicator of connection state to users

**Consequences:**
- Storyteller sends whisper, player never receives it (game-breaking)
- Player thinks they have current state but they're seeing stale data
- Trust erosion - users learn to manually refresh "just in case"

**Warning signs:**
- Users report "sometimes messages don't come through"
- QA cannot reproduce reliably (timing-dependent)
- Mobile users affected more than desktop
- Issues appear after ~30-60 seconds of inactivity

**Prevention:**
1. Monitor heartbeat status - Supabase sends heartbeats every 25 seconds by default
2. Display connection status indicator (green/yellow/red) in UI
3. Implement reconnection callback that re-fetches missed messages
4. Test specifically: lock phone screen for 60 seconds, unlock, verify state

**Phase relevance:** Phase 1 (Core Infrastructure) - Must be foundation

**Sources:**
- [Supabase Realtime Troubleshooting](https://supabase.com/docs/guides/realtime/troubleshooting)
- [Supabase Realtime Heartbeat Messages](https://supabase.com/docs/guides/troubleshooting/realtime-heartbeat-messages)
- [GitHub Issue: Background Tab Disconnection](https://github.com/supabase/realtime-js/issues/121)

---

### CP-2: Row-Level Security (RLS) Misconfiguration

**What goes wrong:** Either (a) RLS disabled = data exposed to all users, or (b) RLS enabled without policies = no one can access anything, or (c) RLS blocks Realtime subscriptions.

**Why it happens:**
- Supabase creates tables with RLS disabled by default
- Enabling RLS without policies means "deny all access"
- Realtime ONLY works on tables with RLS enabled + replication enabled
- Developers test with service role key (bypasses RLS) and miss issues

**Consequences:**
- CVE-2025-48757: 170+ apps had exposed databases because RLS wasn't enabled
- Messages visible to wrong players (privacy breach in social deduction game = game-ruining)
- Realtime stops working entirely after enabling RLS

**Warning signs:**
- "It works in development but not production" (service role vs anon key)
- Realtime subscriptions show TIMED_OUT or never fire
- Users can see data they shouldn't via browser dev tools

**Prevention:**
1. Enable RLS on ALL tables from day one
2. Create explicit policies BEFORE any client access
3. Test with anon key, never service role, in development
4. Add RLS policy specifically for Realtime: `USING (auth.uid() = user_id)`
5. Use Supabase Dashboard "Security Advisor" regularly

**Phase relevance:** Phase 1 (Database Schema) - Non-negotiable foundation

**Sources:**
- [Supabase RLS Documentation](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase Pitfalls: Common Mistakes](https://hrekov.com/blog/supabase-common-mistakes)
- [Supabase RLS Security Guide 2025](https://vibeappscanner.com/supabase-row-level-security)

---

### CP-3: Mobile Background/Foreground State Transitions

**What goes wrong:** When user switches apps, locks screen, or backgrounds the browser, WebSocket disconnects. When they return, the connection may not properly restore, leaving them with stale state.

**Why it happens:**
- iOS Safari drops WebSocket connections after ~30-60 seconds in background
- Android battery optimization can kill background connections
- JavaScript execution pauses when tab is backgrounded
- `visibilitychange` event may fire AFTER connection is already dead

**Consequences:**
- Player returns to app thinking they're connected, but they're not
- Missing critical whispers sent while backgrounded
- Race condition: user sees outdated game state, acts on it

**Warning signs:**
- Mobile users report needing to "refresh to see new messages"
- Inconsistent state between players
- Issues correlate with users who multitask during games

**Prevention:**
1. Listen to `visibilitychange` API and force reconnection on `visible`
2. On reconnect, fetch all messages since last known timestamp
3. Display "reconnecting..." state during recovery
4. Consider NoSleep.js for active game sessions (with user disclosure)
5. Test: background app for 2 minutes, return, verify state recovery

**Phase relevance:** Phase 2 (Reconnection Logic) - Critical for mobile-first

**Sources:**
- [GitHub: Safari WebSocket Issues](https://github.com/socketio/socket.io/issues/2924)
- [Mobile WebSocket Recovery Patterns](https://www.xjavascript.com/blog/how-do-i-recover-from-a-websocket-client-computer-going-to-sleep-or-app-going-to-background-safari-on-ipad/)
- [Supabase Realtime Reconnection Discussion](https://github.com/orgs/supabase/discussions/27513)

---

### CP-4: Postgres Changes vs Broadcast Performance at Scale

**What goes wrong:** Using `postgres_changes` subscription for all realtime updates. Works fine with 5 users, becomes a bottleneck with 50+.

**Why it happens:**
- Postgres Changes checks RLS for EVERY subscriber on EVERY change
- 100 users subscribed + 1 insert = 100 RLS policy evaluations
- Processed on single thread - compute upgrades don't help
- Complex RLS policies multiply the problem

**Consequences:**
- Messages delayed by seconds (ruins realtime feel)
- Database CPU spikes during active games
- Timeout errors under load
- Uneven experience - some users fast, others slow

**Warning signs:**
- Latency increases with user count
- Database CPU high during message bursts
- `tenant_events` rate limit errors in logs
- Works great in solo testing, degrades in group testing

**Prevention:**
1. Use Broadcast for player-to-player messaging (not postgres_changes)
2. Use postgres_changes only for durable state changes (game state, not chat)
3. Consider "Broadcast from Database" pattern for hybrid needs
4. Create separate "public" table without RLS for broadcast relay
5. Load test with realistic concurrent user counts early

**Phase relevance:** Phase 1 (Architecture Decision) - Choose Broadcast for messages

**Sources:**
- [Supabase Broadcast Documentation](https://supabase.com/docs/guides/realtime/broadcast)
- [Supabase Realtime Benchmarks](https://supabase.com/docs/guides/realtime/benchmarks)
- [Broadcast from Database Blog](https://supabase.com/blog/realtime-broadcast-from-database)

---

## Supabase-Specific Pitfalls

Issues specific to Supabase Realtime implementation.

### SP-1: TooManyChannels Error

**What goes wrong:** App creates new channel subscriptions without cleaning up old ones. Eventually hits limit (100 channels per connection) and subscriptions fail.

**Why it happens:**
- React component mounts/unmounts without cleanup
- Navigation creates new subscription, doesn't remove old
- React Strict Mode double-invokes useEffect
- Missing cleanup function in useEffect

**Consequences:**
- `too_many_channels` error after using app for a while
- Realtime stops working until page refresh
- Memory leak degrades performance over time

**Warning signs:**
- App works initially, breaks after navigating around
- Console shows channel count increasing
- Works in production, fails in development (Strict Mode)

**Prevention:**
```javascript
useEffect(() => {
  const channel = supabase
    .channel('game-room')
    .on('broadcast', { event: 'whisper' }, handleWhisper)
    .subscribe();

  return () => {
    supabase.removeChannel(channel);  // CRITICAL
  };
}, [roomId]);
```

Use refs to handle Strict Mode:
```javascript
const channelRef = useRef(null);
useEffect(() => {
  if (channelRef.current) return; // Prevent double-subscribe
  channelRef.current = supabase.channel(...).subscribe();
  return () => {
    supabase.removeChannel(channelRef.current);
    channelRef.current = null;
  };
}, []);
```

**Phase relevance:** Phase 1 (Subscription Pattern) - Establish pattern early

**Sources:**
- [Supabase Discussion: React Strict Mode Issue](https://github.com/supabase/realtime-js/issues/169)
- [Supabase Discussion: Unsubscribing Issues](https://github.com/orgs/supabase/discussions/8573)
- [Egghead: Supabase Realtime Cleanup](https://egghead.io/lessons/supabase-subscribe-to-database-changes-with-supabase-realtime)

---

### SP-2: Replication Not Enabled

**What goes wrong:** Postgres changes subscription created but no events fire. Connection works, no errors shown, but updates never arrive.

**Why it happens:**
- Table not added to Supabase Realtime publication
- Replication slot not configured
- Easy to miss because there's no explicit error

**Consequences:**
- Realtime appears to work (connected) but no messages
- Developers think it's a code bug, waste time debugging

**Warning signs:**
- Connection status is "subscribed" but no events fire
- INSERT/UPDATE to table doesn't trigger callback
- Works via Broadcast but not postgres_changes

**Prevention:**
1. In Supabase Dashboard: Database > Replication > Enable for table
2. Or via SQL: `ALTER PUBLICATION supabase_realtime ADD TABLE your_table;`
3. Verify with: `SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';`
4. Create a test script that inserts and verifies callback fires

**Phase relevance:** Phase 1 (Setup Verification) - Checklist item

**Sources:**
- [Supabase Realtime Getting Started](https://supabase.com/docs/guides/realtime/getting_started)
- [Supabase Realtime Architecture](https://supabase.com/docs/guides/realtime/architecture)

---

### SP-3: RLS Policy Performance in Realtime

**What goes wrong:** Complex RLS policies cause significant latency in realtime message delivery. Policies that are "fine" for regular queries become bottlenecks when evaluated 100x per message.

**Why it happens:**
- Every Realtime postgres_change must evaluate RLS for each subscriber
- Policies with subqueries evaluated per-row
- Missing indexes on policy columns
- `auth.uid()` called repeatedly instead of cached

**Consequences:**
- Message delivery latency of seconds
- Database connection timeouts
- Inconsistent latency (sometimes fast, sometimes slow)

**Warning signs:**
- Latency increases with subscriber count
- `EXPLAIN ANALYZE` shows policy evaluation time
- Database CPU spikes correlate with realtime activity

**Prevention:**
1. Index all columns used in RLS policies
2. Wrap `auth.uid()` in subquery for caching:
   ```sql
   -- Slow: auth.uid() called per row
   USING (user_id = auth.uid())

   -- Fast: auth.uid() cached per statement
   USING (user_id = (SELECT auth.uid()))
   ```
3. Avoid subqueries in policies; restructure to use `IN` with cached values
4. Consider Broadcast instead of postgres_changes for high-frequency updates

**Phase relevance:** Phase 1 (Policy Design) - Get patterns right early

**Sources:**
- [Supabase RLS Performance Best Practices](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv)
- [Supabase Discussion: RLS Performance](https://github.com/orgs/supabase/discussions/14576)

---

### SP-4: Rate Limit Confusion

**What goes wrong:** App exceeds rate limits, connections get throttled, but client auto-reconnects creating a storm of connect/disconnect cycles.

**Free plan limits:**
- 200 concurrent connections
- 100 messages/second
- 100 channel joins/second

**Why it happens:**
- Each browser tab = 1 connection
- Users opening multiple tabs quickly exhaust limits
- Burst of messages during game events exceeds msg/sec
- supabase-js auto-reconnects, which can worsen the storm

**Consequences:**
- `too_many_connections` errors
- `tenant_events` rate limit triggered
- Cascading failures as reconnection attempts add load

**Warning signs:**
- Errors appear during peak activity times
- Backend logs show rate limit errors
- Client shows repeated connect/disconnect cycles

**Prevention:**
1. Implement connection deduplication (one tab active at a time)
2. Debounce/throttle message sending
3. Use presence to detect duplicate sessions
4. Monitor connection count in Supabase Dashboard
5. Plan for Pro tier if expecting >50 concurrent users

**Phase relevance:** Phase 2 (Scaling) - Plan limits early, implement controls

**Sources:**
- [Supabase Realtime Limits](https://supabase.com/docs/guides/realtime/limits)

---

## Mobile PWA Pitfalls

Issues specific to mobile Progressive Web Apps.

### MP-1: iOS Push Notification Requirements

**What goes wrong:** Push notifications implemented but don't work on iOS. Users can't receive whispers when app is backgrounded.

**Why it happens:**
- iOS ONLY supports push notifications for PWAs added to home screen
- Requires proper web app manifest configuration
- Users must manually enable in Safari settings
- EU users on iOS 17.4+ cannot use PWA push at all (regulatory)

**Consequences:**
- Major feature doesn't work for iOS users
- Different UX between Android and iOS
- Users don't understand why it doesn't work

**Warning signs:**
- "Push works on Android but not iOS"
- iOS users report never receiving notifications
- Push permission prompt never appears on iOS

**Prevention:**
1. Detect iOS and show explicit "Add to Home Screen" instructions
2. Verify manifest.json has all required fields
3. Guide users through Safari Settings > Notifications
4. Have fallback: in-app notification queue checked on return
5. For EU users: consider alternative notification strategy

**Phase relevance:** Phase 3 (Push Notifications) - Plan iOS limitations from start

**Sources:**
- [PWA Push Notifications Complete Guide](https://www.magicbell.com/blog/using-push-notifications-in-pwas)
- [iOS PWA Limitations 2025](https://ravi6997.medium.com/pwas-on-ios-in-2025-why-your-web-app-might-beat-native-0b1c35acf845)
- [Solving iOS PWA Limitations](https://iphtechnologies9.wordpress.com/2025/07/01/solving-ios-pwa-limitations-push-notifications-offline-access/)

---

### MP-2: Service Worker Cache Conflicts with Realtime

**What goes wrong:** Service worker caches aggressively, users see stale data even though realtime updates are working. Or: users see old version of app because service worker won't update.

**Why it happens:**
- Cache-first strategy serves old data
- Service worker intercepts API requests
- Safari honors cache directives more strictly than Chrome
- No coordination between React state and SW cache

**Consequences:**
- User sees outdated messages/game state
- Different users see different app versions
- "It works when I clear cache" becomes common

**Warning signs:**
- Users report stale data that refresh doesn't fix
- Issues correlate with returning users (not first visit)
- Different behavior between browsers

**Prevention:**
1. Use Network-First strategy for API endpoints
2. Use Cache-First only for static assets (JS, CSS, images)
3. Implement cache versioning with app deployments
4. Add timestamp/cache-buster to API requests
5. Consider `skipWaiting()` for critical updates
6. Test: load app, deploy update, reload, verify new version

**Phase relevance:** Phase 3 (PWA) - Configure caching strategy carefully

**Sources:**
- [Taming PWA Cache Behavior](https://iinteractive.com/resources/blog/taming-pwa-cache-behavior)
- [Web.dev PWA Update Guide](https://web.dev/learn/pwa/update/)
- [Handling Service Worker Updates](https://whatwebcando.today/articles/handling-service-worker-updates/)

---

### MP-3: Android Battery Optimization

**What goes wrong:** Android system kills background WebSocket connections to save battery. User thinks they're connected but aren't.

**Why it happens:**
- Android battery optimization is aggressive
- PWAs don't get same privileges as native apps
- Doze mode throttles network activity
- Users rarely whitelist web apps

**Consequences:**
- Notifications delayed or dropped
- Realtime updates stop working in background
- Inconsistent behavior across Android devices/versions

**Warning signs:**
- "Works on some Android phones but not others"
- Users report it worked yesterday, not today
- Issues correlate with low battery or battery saver mode

**Prevention:**
1. Detect Android and suggest battery optimization whitelist
2. Implement robust reconnection on foreground
3. Use push notifications for critical messages (don't rely on WebSocket)
4. Show reconnection status clearly in UI
5. Test on various Android devices and battery states

**Phase relevance:** Phase 2 (Reconnection) - Part of mobile resilience

**Sources:**
- [PWA Push Notifications Guide](https://www.mobiloud.com/blog/pwa-push-notifications)

---

## React State Management Pitfalls

Issues with React patterns in realtime apps.

### RP-1: Optimistic Updates Causing Inconsistency

**What goes wrong:** UI shows optimistic state, but server rejects/modifies the change. User briefly sees incorrect state, then it "jumps" to actual state.

**Why it happens:**
- Optimistic update assumes success
- No conflict resolution when server disagrees
- Multiple clients updating simultaneously
- Network latency creates race conditions

**Consequences:**
- "I sent a message but it disappeared"
- Confusing jumps in UI state
- Trust erosion in the app

**Warning signs:**
- Messages briefly appear then vanish
- State "jumps" or "flickers"
- Issues increase with poor network

**Prevention:**
1. For critical actions (whispers): don't use optimistic updates
2. Show pending state (spinner, "sending...") instead of optimistic success
3. If using optimistic: implement rollback on error
4. Implement idempotency keys to prevent duplicates
5. Keep server as source of truth, client as cache

**Phase relevance:** Phase 2 (Message Handling) - Choose pattern deliberately

**Sources:**
- [React useOptimistic Documentation](https://react.dev/reference/react/useOptimistic)
- [TkDodo: Concurrent Optimistic Updates](https://tkdodo.eu/blog/concurrent-optimistic-updates-in-react-query)
- [Why I Never Use Optimistic Updates](https://dev.to/criscmd/why-i-never-use-optimistic-updates-and-why-you-might-regret-it-too-4jem)

---

### RP-2: Message Ordering and Race Conditions

**What goes wrong:** Messages appear out of order. Player sees responses before questions. Duplicate messages appear.

**Why it happens:**
- Network latency varies per message
- Concurrent sends from multiple clients
- Retries create duplicates
- Client timestamp vs server timestamp disagreement

**Consequences:**
- Conversation thread is confusing
- Duplicates clutter the UI
- Game state appears inconsistent

**Warning signs:**
- "Why did that message appear before the other one?"
- Same message appears twice
- Order differs between clients

**Prevention:**
1. Use server-generated timestamps, not client
2. Sort messages by server timestamp on render
3. Implement deduplication by message ID
4. Consider sequence numbers for strict ordering
5. Use database-generated IDs (not client UUIDs)

```typescript
// Deduplication pattern
const addMessage = (newMsg: Message) => {
  setMessages(prev => {
    if (prev.some(m => m.id === newMsg.id)) return prev; // Skip duplicate
    return [...prev, newMsg].sort((a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  });
};
```

**Phase relevance:** Phase 1 (Message Model) - Design for ordering from start

**Sources:**
- [Ably: Chat Architecture Message Ordering](https://ably.com/blog/chat-architecture-reliable-message-ordering)
- [Message Ordering in Messaging Systems](https://www.architecture-weekly.com/p/ordering-grouping-and-consistency)

---

## Prevention Strategies Summary

### Phase 1: Foundation (Must Get Right)
| Pitfall | Prevention |
|---------|------------|
| CP-2: RLS Misconfiguration | Enable RLS + policies from day 1, test with anon key |
| CP-4: Postgres Changes scaling | Choose Broadcast for messages, postgres_changes for state |
| SP-1: Channel cleanup | Establish useEffect cleanup pattern early |
| SP-2: Replication | Verify replication enabled before coding |
| SP-3: RLS Performance | Index policy columns, cache auth.uid() |
| RP-2: Message ordering | Server timestamps, deduplication, sorting |

### Phase 2: Resilience (Mobile-Critical)
| Pitfall | Prevention |
|---------|------------|
| CP-1: Silent failures | Connection status indicator, heartbeat monitoring |
| CP-3: Background transitions | visibilitychange handler, reconnection + refetch |
| SP-4: Rate limits | Connection deduplication, throttling |
| MP-3: Android battery | Reconnection logic, push fallback |
| RP-1: Optimistic updates | Pending states over optimistic, rollback on error |

### Phase 3: PWA Features
| Pitfall | Prevention |
|---------|------------|
| MP-1: iOS push | Home screen requirement, explicit user guidance |
| MP-2: Cache conflicts | Network-first for API, versioned caching |

---

## Testing Checklist

Critical scenarios to test before each release:

### Connection Resilience
- [ ] Lock phone screen for 60 seconds, unlock, verify state
- [ ] Switch to another app for 2 minutes, return, verify state
- [ ] Enable airplane mode, send message, disable, verify delivery
- [ ] Open app in 3 tabs, verify behavior (should dedupe or warn)
- [ ] Let app sit idle for 5 minutes, send message from another client

### Message Integrity
- [ ] Two users send messages simultaneously, verify ordering
- [ ] Send message on poor network, verify no duplicates
- [ ] Send while backgrounded, verify queued delivery

### Permission Boundaries
- [ ] Player A cannot see Player B's whispers
- [ ] Non-Storyteller cannot send whispers
- [ ] Verify RLS with browser devtools network inspection

### Mobile Specific
- [ ] iOS: Add to home screen, verify push works
- [ ] Android: Battery saver mode, verify reconnection
- [ ] Both: Background for 30 seconds, verify reconnection

---

## Confidence Assessment

| Pitfall Category | Confidence | Basis |
|------------------|------------|-------|
| Supabase Realtime | HIGH | Official docs + community issues |
| Mobile WebSocket | HIGH | Multiple authoritative sources |
| PWA Push (iOS) | HIGH | Official Apple documentation patterns |
| React State Management | HIGH | React docs + established patterns |
| Performance at Scale | MEDIUM | Benchmarks exist but context-dependent |

---

## Sources Summary

### Official Documentation
- [Supabase Realtime Troubleshooting](https://supabase.com/docs/guides/realtime/troubleshooting)
- [Supabase Realtime Limits](https://supabase.com/docs/guides/realtime/limits)
- [Supabase RLS Documentation](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase Broadcast Documentation](https://supabase.com/docs/guides/realtime/broadcast)
- [React useOptimistic Documentation](https://react.dev/reference/react/useOptimistic)

### Community Issues
- [GitHub: React Strict Mode Issue](https://github.com/supabase/realtime-js/issues/169)
- [GitHub: Background Tab Disconnection](https://github.com/supabase/realtime-js/issues/121)
- [GitHub: Reconnection After TIMED_OUT](https://github.com/supabase/realtime/issues/1088)

### Technical Articles
- [Ably: Chat Architecture Message Ordering](https://ably.com/blog/chat-architecture-reliable-message-ordering)
- [PWA Push Notifications Guide](https://www.magicbell.com/blog/using-push-notifications-in-pwas)
- [Taming PWA Cache Behavior](https://iinteractive.com/resources/blog/taming-pwa-cache-behavior)
