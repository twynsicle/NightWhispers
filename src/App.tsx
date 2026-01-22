import { createBrowserRouter, RouterProvider } from 'react-router'
import { Center, Loader } from '@mantine/core'
import { useAuth } from './hooks/useAuth'
import { HomePage } from './pages/HomePage/HomePage'
import { SessionSetupPage } from './pages/SessionSetupPage/SessionSetupPage'
import { CreateRoomPage } from './pages/CreateRoomPage/CreateRoomPage'
import { JoinRoomPage } from './pages/JoinRoomPage/JoinRoomPage'
import { RoomLayout, roomLoader } from './pages/RoomLayout/RoomLayout'
import { LobbyPage } from './pages/LobbyPage/LobbyPage'
import { GamePage } from './pages/GamePage/GamePage'

/**
 * React Router 7 configuration for Night Whispers.
 *
 * Uses createBrowserRouter + RouterProvider for loader support (Pattern 3).
 * Loaders enable protected routes without FOUC (flash of unauthenticated content).
 *
 * Routes:
 * - / : Landing page (create/join choice)
 * - /setup : Session setup (display name + avatar)
 * - /create : Room creation (Storyteller)
 * - /join : Room joining (Player)
 * - /room/:roomId : Parent layout (loader + shared state)
 *   - /room/:roomId/lobby : Lobby view (waiting for game start)
 *   - /room/:roomId/game : Active game view (messaging interface)
 */
const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/setup',
    element: <SessionSetupPage />,
  },
  {
    path: '/create',
    element: <CreateRoomPage />,
  },
  {
    path: '/join',
    element: <JoinRoomPage />,
  },
  {
    path: '/room/:roomId',
    element: <RoomLayout />,
    loader: roomLoader,
    children: [
      // Index route - parent redirects based on room status
      { index: true, element: null },
      { path: 'lobby', element: <LobbyPage /> },
      { path: 'game', element: <GamePage /> },
    ],
  },
])

/**
 * Root App component with session recovery.
 *
 * Implements Pattern 1 (Session Recovery) from RESEARCH.md.
 * Session recovery happens before routing to enable auto-rejoin functionality.
 *
 * Flow:
 * 1. useAuth hook checks localStorage for existing session
 * 2. Shows loading screen while session is being recovered
 * 3. Once loading completes, renders router
 * 4. Protected routes (RoomPage) can now access valid session
 */
function App() {
  const { loading } = useAuth()

  if (loading) {
    return (
      <Center h="100vh">
        <Loader size="lg" />
      </Center>
    )
  }

  return <RouterProvider router={router} />
}

export default App
