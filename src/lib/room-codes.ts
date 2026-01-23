import { customAlphabet } from 'nanoid'

/**
 * Generates 4-letter room codes using collision-resistant random IDs.
 *
 * Alphabet uses only uppercase letters, excluding visually similar characters
 * (I, O, L) to prevent user confusion when reading/entering codes.
 *
 * Collision probability:
 * - 23 chars × 4 positions = 279,841 combinations
 * - 50% collision chance at ~620 active rooms (birthday paradox)
 * - Database unique constraint + retry handles rare collisions
 *
 * @returns {string} 4-letter room code (e.g., "TXKB")
 */
export const generateRoomCode = customAlphabet('ABCDEFGHJKMNPQRSTUVWXYZ', 4)
