/**
 * Phase logic utilities for Night Whispers.
 *
 * Game phases follow Blood on the Clocktower conventions:
 * Night 1 -> Day 1 -> Night 2 -> Day 2 -> ...
 *
 * Night phases are when the Storyteller privately messages players.
 * Day phases are for public discussion and voting.
 */

import { INITIAL_PHASE } from '../../../lib/constants'

/**
 * Get the next phase in the game cycle.
 *
 * Phase pattern:
 * - "Night X" -> "Day X"
 * - "Day X" -> "Night X+1"
 *
 * @param currentPhase - Current phase string (e.g., "Night 1", "Day 2")
 * @returns Next phase string
 *
 * @example
 * getNextPhase("Night 1") // -> "Day 1"
 * getNextPhase("Day 1")   // -> "Night 2"
 * getNextPhase("Night 2") // -> "Day 2"
 */
export function getNextPhase(currentPhase: string): string {
  // Parse phase type and number using regex
  // Matches "Night X" or "Day X" where X is a number (single space only)
  const match = currentPhase.match(/^(Night|Day) (\d+)$/i)

  if (!match) {
    // Invalid phase format, default to initial phase
    console.warn(
      `Invalid phase format: "${currentPhase}", defaulting to ${INITIAL_PHASE}`
    )
    return INITIAL_PHASE
  }

  const [, phaseType, phaseNumberStr] = match
  const phaseNumber = parseInt(phaseNumberStr, 10)

  // Night -> Day (same number)
  // Day -> Night (increment number)
  if (phaseType.toLowerCase() === 'night') {
    return `Day ${phaseNumber}`
  } else {
    return `Night ${phaseNumber + 1}`
  }
}
