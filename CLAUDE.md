# Night Whispers - Project Instructions

## Project Overview

**Night Whispers** is a mobile-first web application for managing private Storyteller-to-player communications during social deduction game night phases (primarily Blood on the Clocktower). It replaces the impractical "eyes closed" mechanic with private digital messaging.

**Core Value:** Storyteller can privately message any player, and players can only respond to the Storyteller—no player-to-player communication allowed. Zero friction (no accounts, no downloads, just a room code).

**Target Users:** In-person Blood on the Clocktower groups and other social deduction games (Werewolf, etc.)

## Tech Stack

- **Frontend:** React 19 + Vite 7 + TypeScript
- **UI:** Mantine 8 (dark theme with crimson/gold gothic aesthetic)
- **Backend:** Supabase (PostgreSQL + Realtime + Edge Functions)
- **State:** Zustand for local state
- **Routing:** React Router 7 with loader-based protection
- **Testing:** Vitest + Playwright
- **Auth:** Anonymous auth with localStorage session persistence

## Project Structure

```
src/
  components/       # Reusable UI components (AvatarSelector, etc.)
  hooks/           # React hooks (useAuth for session management)
  lib/             # Utilities (supabase client, room helpers, room codes)
  pages/           # Route components (HomePage, RoomPage, etc.)
  theme.ts         # Mantine theme config (gothic dark theme)
  main.tsx         # App entry point
supabase/
  migrations/      # Database schema and RLS policies
.planning/         # GSD project documentation (PROJECT.md, ROADMAP.md, etc.)
```

## Key Architecture Patterns

### Authentication & Sessions
- Anonymous auth via Supabase (`supabase.auth.signInAnonymously()`)
- Session persists in localStorage for reconnection across refreshes
- `useAuth` hook handles session recovery on mount
- iOS WebKit 7-day localStorage cap requires validation on every mount

### Room Management
- 4-letter room codes via nanoid (1M combinations, 32-char safe alphabet)
- Recursive collision retry on duplicate codes (< 1% chance at < 1K rooms)
- Upsert pattern for participant joining (prevents duplicates on reconnection)

### Database & RLS
- Tables: `rooms`, `participants`, `messages`
- RLS policies enforce room isolation and role-based access
- Storyteller sees all messages in room; players see only their own chat
- Helper functions use `SECURITY DEFINER` for RLS context queries

### Messaging (Planned)
- Supabase Broadcast for real-time message delivery
- PostgreSQL for message persistence
- Postgres Changes for room/participant state sync
- Supabase Presence for typing indicators

### Routing
- React Router 7 with `createBrowserRouter` + loaders
- Loader-based route protection prevents FOUC (flash of unauthenticated content)
- Protected routes: `/room/:roomId` requires valid session + participant

## Important Files

- `src/lib/supabase.ts` - Supabase client instance and type definitions
- `src/hooks/useAuth.ts` - Session management hook
- `src/lib/rooms.ts` - Room creation/joining utilities
- `src/lib/room-codes.ts` - Room code generation
- `supabase/migrations/001_initial_schema.sql` - Database schema
- `supabase/migrations/002_rls_policies.sql` - Row-level security policies
- `.planning/PROJECT.md` - Project vision and requirements
- `.planning/ROADMAP.md` - 6-phase development roadmap
- `.planning/STATE.md` - Current project state and progress

## Current State

**Phase:** 2 of 6 (Session & Room Entry) - COMPLETE
**Next:** Phase 3 - Lobby & Room Management

**Completed:**
- Phase 1: Foundation (Vite + Supabase setup)
- Phase 2: Session & Room Entry (auth, room creation/joining, UI pages)

**Available Routes:**
- `/` - Landing page (create/join choice)
- `/setup` - Session setup (display name + avatar)
- `/create` - Room creation (Storyteller)
- `/join` - Room joining (Player)
- `/room/:roomId` - Protected game interface

**Database Ready:** Schema deployed with RLS policies

## Development Workflow

### Use Context7 by Default
Always use context7 when you need code generation, setup or configuration steps, or library/API documentation.

### Workflow Notes
- When running noisy commands like `npm install` where we don't typically care about the output, suppress the output to avoid loading the AI agent's context with useless information that eats tokens.
- Use `/code-review:code-review` plugin when reviewing code.
- Use `/frontend-design` command when creating UI.
- Avoid running lint checks and applying prettier directly – formatting and linting are handled via PostToolUse hook.

### GSD Commands
- `/gsd:progress` - Check project progress and next steps
- `/gsd:plan-phase N` - Create plan for phase N
- `/gsd:execute-phase N` - Execute all plans in phase N

## Key Design Decisions

- **Anonymous auth:** Ephemeral games don't need persistent accounts
- **Gothic emoji avatars:** Zero assets, accessible, mobile-friendly (🧙‍♂️🧛‍♀️🧟‍♂️👻🎭🕵️🦇🌙⚰️🔮🗡️🛡️)
- **Mobile-first:** Primary use case is in-person game night on phones
- **System fonts:** Faster mobile loading, no font download latency
- **Mantine 8 split CSS imports:** v8 architecture requires 4 CSS files for optimal tree-shaking
- **4-letter room codes:** Easy to share verbally, low collision risk

## Code Quality Guidelines

### React Hooks & Effects
- **useEffect Dependencies:** Include ALL values that should trigger re-runs, especially props like `participantId` that could change without component unmount. If the effect needs to re-check state when an ID changes, that ID must be in the dependency array.
- **Avoid Stale Closures:** When performing operations that may fail and need rollback, capture state values BEFORE making optimistic updates. The state variable in the catch block will reference the closure value, not the current state.
- **Memory Leak Prevention:** For async operations in useEffect, always use a cleanup flag (`isMounted`) to prevent state updates after unmount.
- **Subscription Management:** When creating Supabase channels/subscriptions in useEffect, ensure cleanup runs `supabase.removeChannel(channel)`.

### Type Safety
- **Avoid Type Assertions:** Prefer runtime type checks (`typeof`, `in` operator) over `as` type assertions.
- **Regenerate Supabase Types:** If relations/joins return unexpected types, regenerate types instead of forcing casts.

### Constants & Magic Values
- **Extract ALL Magic Numbers:** Never hardcode numeric values directly in components or functions. Create constants in `src/lib/constants.ts` for:
  - Validation limits (max lengths, min lengths)
  - Initial/default values (initial phase, default status)
  - Regex patterns used in multiple places
  - **Animation durations and delays** (e.g., `ANIMATION_DURATION_MS`, `ANIMATION_STAGGER_MS`)
  - **Timeouts** (e.g., `SERVICE_WORKER_READY_TIMEOUT_MS`)
  - **UI thresholds** (e.g., drag activation distance, debounce delays)
- **Use Constants Consistently:** Import and use constants everywhere they apply.
- **Prefer Emoji Literals:** Use emoji characters directly (`💬`, `📢`, `💀`) instead of Unicode escape sequences (`'\u{1F4AC}'`). Emoji literals are more readable and the project already uses them for gothic emoji avatars.

### Optimistic UI Updates
- **Capture State Before Updates:** When implementing optimistic updates with rollback, ALWAYS capture the current state before applying the optimistic change:
  ```typescript
  // CORRECT: Capture before optimistic update
  const oldOrder = playerOrder
  setPlayerOrder(newOrder)
  try {
    await persistChange(newOrder)
  } catch {
    setPlayerOrder(oldOrder) // Rollback works
  }

  // WRONG: State reference is stale in catch block
  setPlayerOrder(newOrder)
  try {
    await persistChange(newOrder)
  } catch {
    setPlayerOrder(playerOrder) // BUG: playerOrder is the NEW value due to closure
  }
  ```

### Environment Variables
- **Validate Early:** Check for required environment variables at the top of functions/hooks that need them. Don't let operations proceed with missing config.
- **Set Appropriate State:** If a feature requires config that's missing (e.g., VAPID key for push), set state to 'unsupported' early rather than failing later.

### Error Handling
- **Single Source of Truth:** Error notifications should be shown in ONE place (either hook or component, not both).
- **Consistent Error Messages:** Include helpful context in error messages.
- **Document Consistency Trade-offs:** If eventual consistency is acceptable (e.g., multi-step operations without transactions), document this in JSDoc comments.

### Accessibility
- **ARIA Labels:** All interactive elements without text content need `aria-label` attributes.
- **Proper Layout:** Use semantic layout components instead of margin/padding hacks for positioning.
- **Keyboard Navigation:** Ensure all interactive elements are keyboard-accessible.

### Performance & Efficiency
- **Avoid Re-fetching:** Pass data as props instead of re-fetching in child components.
- **Debounce User Input:** Use `useDebouncedValue` for text inputs that trigger database updates.
- **Stricter Validation:** Use strict regex patterns and validation to prevent malformed data from entering the system.

### Code Organization
- **Single Responsibility:** Hooks should handle one concern (data fetching, subscriptions, mutations).
- **Prop Drilling vs Re-fetching:** Prefer passing data through props over re-fetching in child components.
- **Notification Logic:** Keep success/error notifications close to the operation (prefer hooks over components for data operations).

## Out of Scope (v1)

- OAuth/social login
- Player-to-player chat (deliberately excluded)
- Video/audio chat
- Custom script creation UI (v2)
- Multiple concurrent games per user
- Persistent game history (rooms expire after 1 hour)

---
*Last updated: 2026-01-21 - Added optimistic UI, env var validation, and magic number guidelines*
