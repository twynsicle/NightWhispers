# Stack Research: Night Whispers

**Domain:** Realtime messaging game companion app
**Researched:** 2026-01-19
**Overall Confidence:** HIGH

## Executive Summary

The specified stack (React + Vite + Mantine + Supabase + PWA) is well-validated for realtime web applications in 2025/2026. Research confirms all chosen technologies are actively maintained, widely adopted, and have strong ecosystem support. Key recommendations: use React 19 (now stable), Vite 7.x, Mantine 8.x, and the latest Supabase JS client (2.90.x). The stack is appropriate for a mobile-first PWA with realtime messaging.

---

## Core Stack

### Framework & Build

| Technology | Recommended Version | Purpose | Rationale | Confidence |
|------------|---------------------|---------|-----------|------------|
| **React** | 19.2.x | UI Framework | React 19 is now production-stable (since Dec 2024). Includes improved Server Components, Actions API, and automatic optimizations. Backward compatible with React 18 patterns. | HIGH |
| **Vite** | 7.3.x | Build Tool | Latest stable, excellent DX with fast HMR. Requires Node.js 20.19+ or 22.12+. Default browser targets now align with Baseline Widely Available (2025-05-01). | HIGH |
| **TypeScript** | 5.9.x | Type Safety | Current stable version with full React 19 compatibility via @types/react@19.x. | HIGH |

**Why React 19 over React 18:**
- React 19 is production-stable with 6+ months of real-world usage
- New Actions API simplifies async state management (useful for message sending)
- `useOptimistic` hook perfect for optimistic UI in chat applications
- Server Components available if needed later
- Automatic concurrent rendering improves perceived performance

**Why Vite 7 over earlier versions:**
- Native support for modern browser targets
- Improved tree-shaking and bundle optimization
- Better ESM handling
- Breaking change: Node.js 18 no longer supported (EOL April 2025)

### UI Framework

| Technology | Recommended Version | Purpose | Rationale | Confidence |
|------------|---------------------|---------|-----------|------------|
| **Mantine** | 8.3.x | Component Library | Latest stable (v8.0 released May 2025). Split CSS architecture, improved theming. Mobile-first components work well for PWA. | HIGH |
| **@mantine/core** | 8.3.x | Core Components | Buttons, inputs, modals, notifications | HIGH |
| **@mantine/hooks** | 8.3.x | Utility Hooks | useDisclosure, useMediaQuery, useLocalStorage | HIGH |
| **@mantine/notifications** | 8.3.x | Toast System | Built-in notification system for message alerts | HIGH |

**Mantine 8.x Key Changes:**
- Global styles split into 3 files (baseline.css, default-css-variables.css, global.css)
- New code highlighting architecture with adapters
- Improved CSS variable system for theming

### Backend & Realtime

| Technology | Recommended Version | Purpose | Rationale | Confidence |
|------------|---------------------|---------|-----------|------------|
| **Supabase JS** | 2.90.x | Backend Client | Isomorphic client for auth, database, realtime. Dropped Node 18 support in 2.79.0. | HIGH |
| **Supabase Realtime** | (managed) | WebSocket Messaging | Broadcast for ephemeral messages, Presence for online status. Handles 10K+ concurrent connections. | HIGH |
| **Supabase Auth** | (managed) | Authentication | Anonymous auth for room codes. New publishable keys (`sb_publishable_xxx`) replacing anon keys. | HIGH |
| **PostgreSQL** | 15+ (managed) | Database | Supabase-managed. Row Level Security for data isolation per room. | HIGH |

**Realtime Architecture Notes:**
- **Broadcast**: Use for ephemeral messages (Storyteller to players). Low latency, no persistence needed.
- **Presence**: Use for "who's in the room" indicators. Track connected players.
- **Postgres Changes**: Use if persisting message history. Listen to INSERT events on messages table.
- **RLS Required**: Supabase Realtime only works on tables with Row Level Security enabled.

### PWA Infrastructure

| Technology | Recommended Version | Purpose | Rationale | Confidence |
|------------|---------------------|---------|-----------|------------|
| **vite-plugin-pwa** | 1.2.x | PWA Generation | Zero-config PWA with Vite 7 support (added in 1.0.1). Workbox integration. | HIGH |
| **Workbox** | (via plugin) | Service Worker | Caching strategies, offline support. Managed by vite-plugin-pwa. | HIGH |
| **web-push** | 3.6.x | Push Notifications | Server-side VAPID push. Note: Last npm update ~2 years ago but stable API. | MEDIUM |

**Push Notification Architecture:**
- Generate VAPID keys once, store securely
- Client subscribes via `navigator.serviceWorker` + `PushManager`
- Store subscription endpoints in Supabase
- Supabase Edge Function sends push via web-push protocol
- Safari 16+ now supports Web Push (expanded iOS support)

### Testing

| Technology | Recommended Version | Purpose | Rationale | Confidence |
|------------|---------------------|---------|-----------|------------|
| **Vitest** | 4.0.x | Unit/Integration Testing | Vite-native, stable Browser Mode in v4. Breaking changes from v3 require migration. | HIGH |
| **@testing-library/react** | 16.x | React Testing | DOM testing utilities. Use with Vitest. | HIGH |
| **Playwright** | 1.50.x | E2E Testing | Optional for E2E. Vitest 4 includes Playwright Traces integration. | MEDIUM |

**Vitest 4.0 Key Changes:**
- Browser Mode now stable (real browser testing, not JSDOM)
- Visual regression testing built-in
- Import changes: `vitest/browser` instead of `@vitest/browser/context`

---

## Additional Libraries

### State Management

| Library | Version | Purpose | When to Use | Confidence |
|---------|---------|---------|-------------|------------|
| **Zustand** | 5.0.x | Client State | Global UI state (current room, user preferences, UI toggles). Lightweight, hook-based. | HIGH |
| **TanStack Query** | 5.90.x | Server State | Cache Supabase queries, handle loading/error states. Pairs well with Zustand. | HIGH |

**State Architecture Recommendation:**
- **Zustand**: Room state, user role, UI state (modal open, sidebar collapsed)
- **TanStack Query**: Fetching room details, message history (if persisted)
- **Supabase Realtime**: Live messages (ephemeral, not cached)

**Do NOT use both for the same data.** Clear separation prevents state sync bugs.

### Routing

| Library | Version | Purpose | Rationale | Confidence |
|---------|---------|---------|-----------|------------|
| **React Router** | 7.12.x | Client Routing | Package simplified - only need `react-router` (not react-router-dom). Non-breaking upgrade from v6. | HIGH |

**Note:** React Router 7 imports everything from `react-router`. The `react-router-dom` package re-exports for backward compatibility.

### Form Handling (Optional)

| Library | Version | Purpose | Rationale | Confidence |
|---------|---------|---------|-----------|------------|
| **Mantine Form** | 8.3.x | Form State | Built into @mantine/form. Good enough for simple forms (room creation, name entry). | MEDIUM |

For a zero-friction app, avoid heavy form libraries. Mantine's built-in form handling is sufficient.

### Utilities

| Library | Version | Purpose | Rationale | Confidence |
|---------|---------|---------|-----------|------------|
| **nanoid** | 5.x | ID Generation | Generate room codes. Customizable alphabet for human-readable codes. | HIGH |
| **date-fns** | 4.x | Date Formatting | Lightweight date utilities for message timestamps. | MEDIUM |

---

## What NOT to Use

### Deprecated/Outdated

| Technology | Why Avoid | Use Instead |
|------------|-----------|-------------|
| **@supabase/auth-helpers-react** | Deprecated, consolidated | `@supabase/ssr` or direct `@supabase/supabase-js` |
| **Create React App** | Deprecated, slow, no active maintenance | Vite |
| **React Router v5** | Old API, missing features | React Router v7 |
| **Node.js 18** | EOL April 2025, dropped by Supabase JS 2.79.0 | Node.js 20.19+ or 22.12+ |

### Overkill for This Project

| Technology | Why Avoid | Rationale |
|------------|-----------|-----------|
| **Redux** | Unnecessary complexity | Zustand handles this use case with 1/10th the boilerplate |
| **Next.js** | SSR not needed | Client-side PWA with Supabase handles everything. No SEO requirement. |
| **Socket.io** | Redundant | Supabase Realtime handles WebSocket messaging |
| **Firebase** | Vendor lock-in, more expensive | Supabase is open-source, PostgreSQL-based, better RLS |
| **Formik/React Hook Form** | Over-engineering | Mantine Form sufficient for simple forms |
| **Axios** | Unnecessary | Fetch API + TanStack Query, Supabase client handles requests |

### Anti-Patterns to Avoid

| Anti-Pattern | Why Bad | Instead |
|--------------|---------|---------|
| **JSDOM for realtime tests** | Doesn't test real WebSocket behavior | Vitest Browser Mode |
| **Polling for messages** | Battery drain, unnecessary requests | Supabase Realtime subscriptions |
| **Storing session in localStorage** | Security risk on shared devices | Supabase session management (automatically handles) |
| **Global Supabase client** | Testing difficulties, SSR issues | Create client in context provider |

---

## Package.json Recommendation

```json
{
  "dependencies": {
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "react-router": "^7.12.0",
    "@supabase/supabase-js": "^2.90.0",
    "@mantine/core": "^8.3.0",
    "@mantine/hooks": "^8.3.0",
    "@mantine/notifications": "^8.3.0",
    "@mantine/form": "^8.3.0",
    "@tanstack/react-query": "^5.90.0",
    "zustand": "^5.0.10",
    "nanoid": "^5.0.0"
  },
  "devDependencies": {
    "typescript": "^5.9.0",
    "vite": "^7.3.0",
    "@vitejs/plugin-react": "^4.4.0",
    "vite-plugin-pwa": "^1.2.0",
    "vitest": "^4.0.0",
    "@testing-library/react": "^16.0.0",
    "@types/react": "^19.2.0",
    "@types/react-dom": "^19.2.0"
  }
}
```

**Server-side (Edge Functions):**
```typescript
// Deno-based, no npm packages needed
// web-push functionality can be implemented with Deno APIs
// Or use Supabase's built-in notification features
```

---

## Environment Requirements

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| **Node.js** | 20.19 | 22.12+ (LTS) |
| **npm** | 10.x | Latest |
| **Browsers** | Baseline Widely Available 2025-05-01 | Modern evergreen browsers |
| **Deno** | 2.1.4 | Latest (for Edge Functions) |

---

## Supabase Project Setup

### Required Services
- [x] Database (PostgreSQL)
- [x] Auth (Anonymous + Magic Link optional)
- [x] Realtime (Broadcast + Presence)
- [x] Edge Functions (for push notifications)
- [ ] Storage (not needed for MVP)

### Realtime Configuration
1. Enable Realtime on relevant tables in Dashboard
2. Configure RLS policies for room-based access
3. Use Broadcast for ephemeral messages (no table needed)
4. Use Presence for online player tracking

### Auth Configuration
1. Enable Anonymous Sign-Ins for zero-friction entry
2. Optional: Magic Link for returning users
3. Configure email templates if using email auth

---

## Confidence Assessment Summary

| Category | Confidence | Notes |
|----------|------------|-------|
| React 19 + Vite 7 | HIGH | Stable, well-documented, verified via official sources |
| Mantine 8.x | HIGH | Active development, recent releases, comprehensive docs |
| Supabase stack | HIGH | Market leader for realtime + auth, extensive documentation |
| PWA tooling | HIGH | vite-plugin-pwa well-maintained, Vite 7 support confirmed |
| Vitest 4.x | HIGH | Major release Dec 2025, breaking changes documented |
| Zustand + TanStack Query | HIGH | Proven combination, 15M+ weekly downloads for Zustand |
| web-push | MEDIUM | Stable but older package (last update ~2 years), may need alternatives |

---

## Sources

### Official Documentation
- [React Versions](https://react.dev/versions)
- [Vite Releases](https://vite.dev/releases)
- [Mantine Changelog](https://mantine.dev/changelog/all-releases/)
- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [Supabase Auth Quickstart](https://supabase.com/docs/guides/auth/quickstarts/react)
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/)
- [Vitest 4.0 Announcement](https://vitest.dev/blog/vitest-4)

### NPM Packages
- [@supabase/supabase-js](https://www.npmjs.com/package/@supabase/supabase-js) - v2.90.1
- [@tanstack/react-query](https://www.npmjs.com/package/@tanstack/react-query) - v5.90.19
- [zustand](https://www.npmjs.com/package/zustand) - v5.0.10
- [react-router](https://www.npmjs.com/package/react-router) - v7.12.0
- [vite](https://www.npmjs.com/package/vite) - v7.3.1
- [vitest](https://www.npmjs.com/package/vitest) - v4.0.17
- [web-push](https://www.npmjs.com/package/web-push) - v3.6.7

### Community Resources
- [React State Management in 2025](https://www.developerway.com/posts/react-state-management-2025)
- [Building Real-Time Apps with Supabase](https://www.supadex.app/blog/building-real-time-apps-with-supabase-a-step-by-step-guide)
- [MDN Web Push Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/Push_API/Best_Practices)
- [Supabase Edge Functions Architecture](https://supabase.com/docs/guides/functions/architecture)
