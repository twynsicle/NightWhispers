# Feature Landscape: Night Whispers

**Domain:** Real-time messaging + board game companion app for social deduction games
**Researched:** 2026-01-19
**Confidence:** MEDIUM-HIGH (verified via multiple sources, domain-specific research)

## Executive Summary

Night Whispers sits at the intersection of two well-established domains: real-time messaging apps and board game companion apps. The core value proposition - asymmetric messaging where Storyteller sees all conversations but players only see their own - is genuinely novel. Most features can be categorized by borrowing table stakes from messaging apps while differentiating through game-specific functionality.

The "zero friction" goal (room codes, no accounts) aligns with best practices for companion apps - they should enhance the experience without becoming a barrier to gameplay.

---

## Table Stakes

Features users expect. Missing these makes the product feel incomplete or unusable.

### Messaging Fundamentals

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Real-time message delivery** | Core functionality; users expect instant messaging | HIGH | WebSocket infrastructure, reconnection handling, state sync |
| **Message persistence** | Messages must survive page refreshes | MEDIUM | Server-side storage, client-side caching |
| **Typing indicators** | Mental model from all modern chat apps | LOW | WebSocket event broadcast |
| **Read receipts / delivery confirmation** | Users need to know messages were received | LOW | State tracking per message |
| **Connection status indicator** | Users must know if they're online/offline | LOW | WebSocket state, visual UI indicator |
| **Mobile-responsive UI** | "Mobile-first" is the stated goal | MEDIUM | Responsive design, touch-friendly targets |

**Sources:** [Ably Chat Features Guide](https://ably.com/blog/chat-and-messaging-application-features), [DevOps School Messaging Comparison](https://www.devopsschool.com/blog/top-10-messaging-apps-in-2025-features-pros-cons-comparison/)

### Session Management

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Room creation with code** | Core entry mechanism | LOW | Generate unique codes, store room state |
| **Room joining via code** | Core entry mechanism | LOW | Validate code, add player to room |
| **Session reconnection** | Users disconnect constantly (network, phone sleep) | HIGH | Store session state, restore on reconnect, handle message gaps |
| **Graceful disconnection handling** | Users expect temporary disconnects to be recoverable | MEDIUM | Exponential backoff, visual status, automatic retry |
| **Player list visibility** | Users need to know who's in the room | LOW | Real-time player list updates |

**Sources:** [Ably WebSocket Best Practices](https://ably.com/topic/websocket-architecture-best-practices), [Apidog WebSocket Reconnect](https://apidog.com/blog/websocket-reconnect/)

### Push Notifications (PWA)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Push notifications for messages** | Users won't stare at screen during game | HIGH | Service worker, FCM/APNS integration, permission handling |
| **iOS PWA support (16.4+)** | Significant iOS user base | MEDIUM | Requires home screen install, Apple Web Push API |
| **Notification permission flow** | Must request permission at right time | LOW | UX timing, clear value proposition |

**Sources:** [MagicBell PWA Push Guide](https://www.magicbell.com/blog/using-push-notifications-in-pwas), [Brainhub PWA on iOS](https://brainhub.eu/library/pwa-on-ios)

**Critical Note:** iOS push notifications ONLY work when PWA is installed to home screen. Users must be guided through this process.

---

## Differentiators

Features that set Night Whispers apart. Not expected, but create competitive advantage and fulfill the unique value proposition.

### Core Differentiator: Asymmetric Messaging

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Storyteller sees all chats** | Unique value prop - no other app does this well | MEDIUM | Permission model, UI showing all conversations |
| **Players see only their chat** | Privacy model players expect from physical game | LOW | Filter messages by recipient |
| **Storyteller-to-individual messaging** | Private info (role, night info) | LOW | 1:1 chat from Storyteller to each player |
| **Storyteller broadcast to all** | Announce phase changes, game events | LOW | 1:many message type |

This is the CORE differentiator. Blood on the Clocktower apps like [Clocktower Online](https://clocktower.online/) and [BOTC Notes](https://www.botc-notes.com/) focus on grimoire/tracking, not Storyteller-player communication.

### Game State Management

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Role assignment** | Core game function, reduces physical setup | LOW | Select from role list, assign to player |
| **Player status (alive/dead/custom)** | Visual indicator for game state | LOW | Toggle status, display in player list |
| **Phase tracking (Night 1, Day 1)** | Game flow management | LOW | Increment/set phase, display prominently |
| **Script/character list templates** | Quick setup for known scripts | MEDIUM | Pre-built data for Trouble Brewing, etc. |

**Sources:** [BotC Helper App](https://apps.apple.com/us/app/botc-helper/id6756976477), [Pocket Grimoire](https://www.pocketgrimoire.co.uk/en_GB/)

### Frictionless Onboarding

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **No account required** | Zero friction - game starts NOW | LOW | Session-based identity, no auth flow |
| **QR code sharing** | Fastest way to share room with players | MEDIUM | Generate QR, camera scan integration |
| **Deep link room joining** | Alternative to QR, shareable via text | LOW | URL with room code, auto-join on open |
| **Name-only identity** | Just enter name, join immediately | LOW | No email, no password, no verification |

**Sources:** [NN/g QR Code Guidelines](https://www.nngroup.com/articles/qr-code-guidelines/), [LogRocket Onboarding UX](https://blog.logrocket.com/ux-design/creating-frictionless-user-onboarding-experience/)

**Key insight:** The "Aha moment" should be sending/receiving the first private message. Time to Aha should be under 60 seconds from app open.

### Enhanced Storyteller Experience

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Quick-action message templates** | Speed up common messages ("You wake up...") | LOW | Pre-defined messages, one-tap send |
| **Multi-player select for messages** | Send same info to multiple players (Minions) | LOW | Checkbox selection, batch send |
| **Player notes (Storyteller-only)** | Track suspicions, info given | MEDIUM | Per-player notes, persisted per session |
| **Game history / transcript** | Review what was said after game | LOW | Store all messages, exportable view |

---

## Anti-Features

Features to deliberately NOT build. Common mistakes in this domain.

### Account / Auth Systems

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **User accounts with email/password** | Friction. Players won't create accounts for a companion app used occasionally | Session-based identity with optional name persistence (localStorage) |
| **Social login (Google, etc.)** | Still friction. Players want to play, not authenticate | Skip entirely |
| **Friend lists / contacts** | Scope creep. This isn't a social network | Room codes handle discovery |
| **Player profiles / avatars** | Over-engineering for a session-based tool | Name + maybe color picker is enough |

**Rationale:** Game companion apps should "open a door, not fill out a tax form." Every authentication step loses players.

### Feature Bloat from Chat Apps

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Voice/video calling** | Massive complexity, not needed (players are physically together or use Discord) | Link to Discord/Zoom if needed |
| **File/media sharing** | Scope creep, not core to game communication | Text-only messages |
| **Message reactions / emoji picker** | Nice-to-have but adds complexity, distracts from game | Simple text, maybe predefined reactions later |
| **Message editing / deletion** | Complexity, potential for game-affecting changes | Messages are immutable |
| **Thread replies** | Over-engineering for simple 1:1 chats | Flat message list |
| **Search / message history** | Session-based tool, not long-term archive | Current game only |
| **End-to-end encryption** | Overkill for casual game chat, adds complexity | HTTPS is sufficient |

**Sources:** [MirrorFly Common Mistakes](https://www.mirrorfly.com/blog/common-developer-mistakes/), [CometChat Developer Mistakes](https://www.cometchat.com/blog/mistake-developers-make-when-building-a-chat-application-from-scratch)

### Game Companion App Anti-Patterns

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Required for gameplay** | App should enhance, not gatekeep. Game must work without app | Design as optional enhancement |
| **Full grimoire replacement** | Scope creep, well-solved by existing tools | Focus on messaging gap |
| **AI narrator suggestions** | Gimmicky, distracts from core value | Maybe v2+ if validated |
| **Stat tracking / game history across sessions** | Scope creep, requires accounts | Single session focus |
| **Custom script builder** | Complex, already solved by other tools | Import or template selection |
| **Timer / clock management** | Nice-to-have, not core to messaging value prop | Phase tracking is sufficient |
| **Character ability reference** | Already in existing apps (Pocket Grimoire) | Link out or embed static reference |

**Sources:** [Game Developer Companion Apps](https://www.gamedeveloper.com/business/4-approaches-to-making-companion-apps-for-video-games), [Final Boss Fight on Companion Apps](https://www.finalbossfight.co.uk/companion-apps/)

**Key insight from AC Unity disaster:** Making the app required for game elements creates resentment. Night Whispers should be an enhancement, with the physical game still playable without it.

---

## Feature Dependencies

Understanding what depends on what for phased implementation.

```
                    +-------------------+
                    | Room Management   |
                    | (create/join)     |
                    +--------+----------+
                             |
              +--------------+--------------+
              |                             |
    +---------v---------+         +---------v---------+
    | Player Identity   |         | WebSocket         |
    | (name, session)   |         | Infrastructure    |
    +--------+----------+         +---------+---------+
             |                              |
             |         +--------------------+
             |         |
    +--------v---------v--------+
    | Real-time Messaging       |
    | (send/receive)            |
    +--------+------------------+
             |
    +--------v------------------+
    | Asymmetric Views          |
    | (Storyteller vs Player)   |
    +--------+------------------+
             |
    +--------+------------------+------+-------------------+
    |                           |                          |
+---v---+              +--------v-------+        +---------v--------+
| Push  |              | Game State     |        | QR Code          |
| Notif |              | (roles, phase) |        | Sharing          |
+-------+              +----------------+        +------------------+
```

### Dependency Chain

1. **Foundation Layer** (must build first):
   - Room creation/joining with codes
   - Basic player identity (name entry)
   - WebSocket connection infrastructure

2. **Core Messaging** (depends on foundation):
   - Message send/receive
   - Message persistence
   - Connection state handling
   - Reconnection logic

3. **Asymmetric Views** (depends on core messaging):
   - Storyteller role assignment
   - Permission-based message filtering
   - Storyteller dashboard UI
   - Player chat UI

4. **Game Features** (depends on asymmetric views):
   - Role assignment
   - Player status (dead/alive)
   - Phase tracking
   - Script templates

5. **Enhancement Features** (independent, can parallelize):
   - Push notifications (depends on Service Worker)
   - QR code generation/scanning
   - Deep links
   - Message templates

### Critical Path

The minimum viable path to differentiated value:

1. Room code join -> 2. WebSocket messaging -> 3. Asymmetric views -> 4. Push notifications

Everything else can be layered on after this core loop works.

---

## MVP Recommendation

Based on table stakes and differentiators analysis.

### MVP Must Include

1. **Room creation/joining** (table stakes)
2. **Real-time messaging** (table stakes)
3. **Asymmetric messaging views** (core differentiator)
4. **Session reconnection** (table stakes)
5. **Push notifications** (table stakes for mobile)
6. **QR code sharing** (differentiator, low complexity)

### MVP Can Defer

| Feature | Reason to Defer |
|---------|----------------|
| Role assignment | Can communicate roles via message |
| Phase tracking | Storyteller can announce phases via message |
| Script templates | Can add later without breaking UX |
| Player notes | Enhancement, not core value |
| Message templates | Typing is fine for MVP |
| Player status | Can communicate via message |

### MVP Must NOT Include

| Feature | Reason to Exclude |
|---------|------------------|
| User accounts | Friction, anti-pattern |
| Voice/video | Scope explosion |
| Media sharing | Not core value |
| Full grimoire | Solved problem elsewhere |

---

## Competitive Landscape

### Existing Tools

| Tool | What It Does | Gap Night Whispers Fills |
|------|--------------|-------------------------|
| [Clocktower Online](https://clocktower.online/) | Virtual grimoire, online play | No physical game support, no in-person messaging |
| [BOTC Notes](https://www.botc-notes.com/) | Player note-taking | Player-focused, no Storyteller-player communication |
| [Pocket Grimoire](https://www.pocketgrimoire.co.uk/en_GB/) | Character reference, grimoire | No messaging |
| [BotC Helper](https://apps.apple.com/us/app/botc-helper/id6756976477) | Role tracking, jinx detection | No real-time messaging |
| [Werewolf Online](https://play.google.com/store/apps/details?id=com.apphteam.werewolfonline.mafiapartygame&hl=en_US) | Fully digital werewolf | Not a companion app, replaces physical game |
| Discord | General chat | No asymmetric views, no game integration |

**The gap:** No tool provides asymmetric real-time messaging for in-person social deduction games. Night Whispers owns this niche.

---

## Sources

### Real-time Messaging
- [Ably: Chat and Messaging Application Features](https://ably.com/blog/chat-and-messaging-application-features)
- [Ably: WebSocket Architecture Best Practices](https://ably.com/topic/websocket-architecture-best-practices)
- [Apidog: WebSocket Reconnect Strategies](https://apidog.com/blog/websocket-reconnect/)
- [MirrorFly: Common Developer Mistakes](https://www.mirrorfly.com/blog/common-developer-mistakes/)
- [CometChat: Developer Mistakes Building Chat](https://www.cometchat.com/blog/mistake-developers-make-when-building-a-chat-application-from-scratch)

### PWA & Push Notifications
- [MagicBell: PWA Push Notifications Guide](https://www.magicbell.com/blog/using-push-notifications-in-pwas)
- [Brainhub: PWA on iOS](https://brainhub.eu/library/pwa-on-ios)
- [App Institute: PWA Push Notifications](https://appinstitute.com/ultimate-guide-to-pwa-push-notifications/)
- [IsItDev: PWA Guide 2025](https://isitdev.com/progressive-web-apps-pwa-guide-2025/)

### UX & Onboarding
- [NN/g: QR Code Guidelines](https://www.nngroup.com/articles/qr-code-guidelines/)
- [LogRocket: Frictionless Onboarding](https://blog.logrocket.com/ux-design/creating-frictionless-user-onboarding-experience/)
- [UserPilot: Onboarding UX Examples](https://userpilot.com/blog/onboarding-ux-examples/)

### Game Companion Apps
- [Game Developer: Companion App Approaches](https://www.gamedeveloper.com/business/4-approaches-to-making-companion-apps-for-video-games)
- [Final Boss Fight: Companion Apps Analysis](https://www.finalbossfight.co.uk/companion-apps/)
- [Meeple Mountain: Digital Integration in Board Games](https://www.meeplemountain.com/articles/digital-integration-the-new-wave-of-app-enhanced-board-games/)

### Blood on the Clocktower Tools
- [Clocktower Online](https://clocktower.online/)
- [BOTC Notes](https://www.botc-notes.com/)
- [BotC Helper App](https://apps.apple.com/us/app/botc-helper/id6756976477)
- [Pocket Grimoire](https://www.pocketgrimoire.co.uk/en_GB/)
