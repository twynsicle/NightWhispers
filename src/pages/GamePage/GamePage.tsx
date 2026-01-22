import { useState } from 'react'
import { useOutletContext } from 'react-router'
import { Stack, Title, Text } from '@mantine/core'
import type { RoomOutletContext } from '../RoomLayout/types'
import { PlayerChatView } from './components/PlayerChatView'
import { StorytellerDashboard } from './components/StorytellerDashboard'
import { PhaseHeader } from './components/PhaseHeader'
import { PhaseControls } from './components/PhaseControls'
import { PushNotificationPrompt } from './components/PushNotificationPrompt'

/**
 * Active game page showing the messaging interface.
 *
 * Displays different views based on role:
 * - Storyteller: Phase controls + Player cards dashboard
 * - Player: Full-screen chat with Storyteller
 *
 * Uses shared context from RoomLayout via useOutletContext.
 */
export function GamePage() {
  const context = useOutletContext<RoomOutletContext>()
  const { participants, roomId, participantId, isStoryteller, roomCode } =
    context

  const [showPushPrompt, setShowPushPrompt] = useState(true)

  return (
    <>
      {/* Title */}
      <Title order={2} c="crimson">
        Room {roomCode}
      </Title>

      {/* Push Notification Prompt - shown on game start (Storyteller only - Player gets it inside PlayerChatView) */}
      {showPushPrompt && isStoryteller && (
        <PushNotificationPrompt
          participantId={participantId}
          onDismiss={() => setShowPushPrompt(false)}
        />
      )}

      {/* Phase Header - visible to all participants */}
      <PhaseHeader roomId={roomId} />

      {isStoryteller ? (
        // Storyteller view: Phase controls + Player cards dashboard
        <Stack gap="md">
          {/* Phase Controls - Storyteller only */}
          <PhaseControls roomId={roomId} />

          <StorytellerDashboard
            roomId={roomId}
            participantId={participantId}
            participants={participants}
          />
        </Stack>
      ) : (
        // Player view: Full-screen chat with Storyteller
        (() => {
          const storyteller = participants.find(p => p.role === 'storyteller')
          if (!storyteller) {
            return (
              <Text size="sm" ta="center" c="dimmed" py="xl">
                Waiting for Storyteller...
              </Text>
            )
          }
          return (
            <PlayerChatView
              roomId={roomId}
              participantId={participantId}
              storytellerId={storyteller.id}
              storytellerName={storyteller.display_name}
              participants={participants}
              roomCode={roomCode}
              showPushPrompt={showPushPrompt}
              onDismissPushPrompt={() => setShowPushPrompt(false)}
            />
          )
        })()
      )}
    </>
  )
}
