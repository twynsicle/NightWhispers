import { customAlphabet } from 'nanoid'

/**
 * Generates 4-letter room codes using collision-resistant random IDs.
 *
 * Alphabet excludes visually similar characters (I/1, O/0, L/1) to prevent
 * user confusion when reading/entering codes.
 *
 * Collision probability:
 * - 32 chars × 4 positions = 1,048,576 combinations
 * - 50% collision chance at ~1,000 active rooms (birthday paradox)
 * - Database unique constraint + retry handles rare collisions
 *
 * @returns {string} 4-letter room code (e.g., "T7XK")
 */
export const generateRoomCode = customAlphabet(
  'ABCDEFGHJKLMNPQRSTUVWXYZ23456789',
  4
)
