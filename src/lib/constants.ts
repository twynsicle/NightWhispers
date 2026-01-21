/**
 * Application-wide constants for Night Whispers.
 *
 * Centralizes magic numbers and strings to prevent inconsistencies
 * and make the codebase more maintainable.
 */

// ============================================================================
// Phase Management
// ============================================================================

/**
 * Initial phase when a game starts or resets.
 */
export const INITIAL_PHASE = 'Night 1' as const

/**
 * Phase types for type-safe phase handling.
 */
export type PhaseType = 'Night' | 'Day'

// ============================================================================
// Player Status
// ============================================================================

/**
 * Maximum length for custom status text (e.g., "Poisoned", "Protected").
 */
export const MAX_CUSTOM_STATUS_LENGTH = 50

// ============================================================================
// Validation Limits
// ============================================================================

/**
 * Display name length constraints.
 */
export const DISPLAY_NAME_MIN_LENGTH = 2
export const DISPLAY_NAME_MAX_LENGTH = 20

// ============================================================================
// Animation Timing
// ============================================================================

/**
 * Default animation duration in milliseconds.
 */
export const ANIMATION_DURATION_MS = 200

/**
 * Stagger delay between consecutive animated items (e.g., message list).
 */
export const ANIMATION_STAGGER_MS = 30

/**
 * Maximum delay cap for staggered animations to prevent excessive waits.
 */
export const ANIMATION_MAX_DELAY_MS = 150

/**
 * Phase transition fade delay in milliseconds.
 */
export const PHASE_TRANSITION_DELAY_MS = 150

// ============================================================================
// Service Worker & Push Notifications
// ============================================================================

/**
 * Timeout for waiting on service worker ready state (ms).
 */
export const SERVICE_WORKER_READY_TIMEOUT_MS = 5000

/**
 * Shorter timeout for checking subscription state (ms).
 */
export const SERVICE_WORKER_CHECK_TIMEOUT_MS = 3000
