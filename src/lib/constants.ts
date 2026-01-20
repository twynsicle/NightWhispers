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
