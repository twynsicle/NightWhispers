import { notifications } from '@mantine/notifications'
import {
  kickParticipant,
  updateParticipantName,
  startGame,
} from '../../../lib/rooms'

interface UseLobbyActionsReturn {
  handleKick: (participantId: string) => Promise<void>
  handleEditSave: (participantId: string, newName: string) => Promise<boolean>
  handleStartGame: (roomId: string) => Promise<void>
}

/**
 * Hook for lobby-specific actions (kick, edit name, start game).
 *
 * Encapsulates action handlers with notifications for success/error states.
 * Used by LobbyPage for Storyteller controls.
 *
 * @returns Object with action handlers
 */
export function useLobbyActions(): UseLobbyActionsReturn {
  // Handler: Kick participant
  const handleKick = async (participantId: string) => {
    try {
      await kickParticipant(participantId)
      notifications.show({
        title: 'Player Removed',
        message: 'Player has been kicked from the room.',
        color: 'green',
      })
    } catch {
      notifications.show({
        title: 'Error',
        message: 'Failed to kick player. Please try again.',
        color: 'red',
      })
    }
  }

  // Handler: Edit participant name
  // Returns true on success, false on failure
  const handleEditSave = async (
    participantId: string,
    newName: string
  ): Promise<boolean> => {
    // Validate name length
    if (newName.length < 2 || newName.length > 20) {
      notifications.show({
        title: 'Invalid Name',
        message: 'Display name must be 2-20 characters.',
        color: 'red',
      })
      return false
    }

    try {
      await updateParticipantName(participantId, newName)
      notifications.show({
        title: 'Name Updated',
        message: 'Player name has been updated.',
        color: 'green',
      })
      return true
    } catch {
      notifications.show({
        title: 'Error',
        message: 'Failed to update name. Please try again.',
        color: 'red',
      })
      return false
    }
  }

  // Handler: Start game
  const handleStartGame = async (roomId: string) => {
    try {
      await startGame(roomId)
      notifications.show({
        title: 'Game Started!',
        message: 'The game is now active.',
        color: 'green',
      })
    } catch {
      notifications.show({
        title: 'Error',
        message: 'Failed to start game. Please try again.',
        color: 'red',
      })
    }
  }

  return { handleKick, handleEditSave, handleStartGame }
}
