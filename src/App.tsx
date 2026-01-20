import { createBrowserRouter, RouterProvider } from 'react-router'
import { HomePage } from './pages/HomePage'
import { SessionSetupPage } from './pages/SessionSetupPage'
import { CreateRoomPage } from './pages/CreateRoomPage'
import { JoinRoomPage } from './pages/JoinRoomPage'
import { RoomPage, roomLoader } from './pages/RoomPage'

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
 * - /room/:roomId : Protected game interface (requires session + participant)
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
    element: <RoomPage />,
    loader: roomLoader,
  },
])

function App() {
  return <RouterProvider router={router} />
}

export default App
