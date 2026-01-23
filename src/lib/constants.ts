/**
 * Application-wide constants for Night Whispers.
 *
 * Centralizes magic numbers and strings to prevent inconsistencies
 * and make the codebase more maintainable.
 */

// ============================================================================
// Room Status
// ============================================================================

/**
 * Valid room status values for runtime validation.
 */
export const VALID_ROOM_STATUSES = ['lobby', 'active', 'ended'] as const

/**
 * Type derived from valid room statuses.
 */
export type RoomStatus = (typeof VALID_ROOM_STATUSES)[number]

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

// ============================================================================
// Room Codes
// ============================================================================

/**
 * Length of room codes (e.g., "ABCD").
 */
export const ROOM_CODE_LENGTH = 4

/**
 * Pattern for validating room codes.
 * Case-insensitive (accepts uppercase or lowercase letters).
 * The code will be normalized to uppercase before use.
 */
export const ROOM_CODE_PATTERN = /^[A-Za-z]{4}$/

// ============================================================================
// Lobby
// ============================================================================

/**
 * Header height for lobby page layout.
 */
export const LOBBY_HEADER_HEIGHT_PX = 56

/**
 * Minimum number of players required to start the game.
 */
export const MIN_PLAYERS_TO_START = 1
