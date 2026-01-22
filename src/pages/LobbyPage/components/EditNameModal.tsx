import { useState } from 'react'
import { Modal, Stack, TextInput, Button } from '@mantine/core'

interface EditingParticipant {
  id: string
  name: string
}

interface EditNameModalProps {
  editingParticipant: EditingParticipant | null
  onClose: () => void
  onSave: (participantId: string, newName: string) => Promise<boolean>
}

/**
 * Modal for editing a participant's display name.
 *
 * Used by Storyteller in the lobby to correct/update player names.
 * Validates name length (2-20 characters) before allowing save.
 *
 * @param editingParticipant - The participant being edited (null when closed)
 * @param onClose - Callback to close the modal
 * @param onSave - Callback to save the new name (returns success boolean)
 */
export function EditNameModal({
  editingParticipant,
  onClose,
  onSave,
}: EditNameModalProps) {
  // Initialize form state from participant, reset via key when participant changes
  const [editedName, setEditedName] = useState(editingParticipant?.name ?? '')
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    if (!editingParticipant) return

    setIsSaving(true)
    const success = await onSave(editingParticipant.id, editedName)
    setIsSaving(false)

    if (success) {
      onClose()
    }
  }

  const isInvalidName = editedName.length < 2 || editedName.length > 20

  return (
    <Modal
      key={editingParticipant?.id}
      opened={editingParticipant !== null}
      onClose={onClose}
      title="Edit Player Name"
      centered
    >
      <Stack gap="md">
        <TextInput
          label="Display Name"
          description="2-20 characters"
          value={editedName}
          onChange={e => setEditedName(e.currentTarget.value)}
          maxLength={20}
          error={isInvalidName ? 'Name must be 2-20 characters' : undefined}
        />
        <Button fullWidth onClick={handleSave} loading={isSaving}>
          Save
        </Button>
        <Button fullWidth variant="light" onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
      </Stack>
    </Modal>
  )
}
