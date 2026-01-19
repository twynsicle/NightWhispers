-- Night Whispers Row Level Security Policies
-- Migration: 002_rls_policies.sql
-- Created: 2026-01-19
--
-- Security model:
-- 1. Only authenticated users can access any data
-- 2. Users can only see/modify data in rooms they belong to
-- 3. Storytellers have elevated permissions within their rooms
-- 4. No anonymous/unauthenticated access possible

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================
-- SECURITY DEFINER allows these functions to query participants table
-- even when called from within RLS policy evaluation

-- Check if current user is an active participant in a room
CREATE OR REPLACE FUNCTION is_room_participant(room_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM participants
    WHERE room_id = room_uuid
    AND user_id = auth.uid()
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if current user is the storyteller of a room
CREATE OR REPLACE FUNCTION is_room_storyteller(room_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM participants
    WHERE room_id = room_uuid
    AND user_id = auth.uid()
    AND role = 'storyteller'
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ROOMS POLICIES
-- ============================================================================

-- Anyone authenticated can create a room (they become storyteller)
CREATE POLICY "users_can_create_rooms" ON rooms
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Users can view rooms they participate in
CREATE POLICY "participants_can_view_room" ON rooms
  FOR SELECT TO authenticated
  USING (is_room_participant(id));

-- Only storyteller can update their room (status, phase changes)
CREATE POLICY "storyteller_can_update_room" ON rooms
  FOR UPDATE TO authenticated
  USING (is_room_storyteller(id))
  WITH CHECK (is_room_storyteller(id));

-- ============================================================================
-- PARTICIPANTS POLICIES
-- ============================================================================

-- Participants can view other participants in their room
CREATE POLICY "participants_can_view_room_members" ON participants
  FOR SELECT TO authenticated
  USING (is_room_participant(room_id));

-- Users can join a room (insert themselves as participant)
CREATE POLICY "users_can_join_room" ON participants
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own participant record (display name, avatar)
CREATE POLICY "users_can_update_self" ON participants
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Storyteller can update any participant in their room (for kicks, status)
CREATE POLICY "storyteller_can_update_participants" ON participants
  FOR UPDATE TO authenticated
  USING (is_room_storyteller(room_id))
  WITH CHECK (is_room_storyteller(room_id));

-- ============================================================================
-- MESSAGES POLICIES
-- ============================================================================

-- Participants can view messages where they are sender, recipient, or broadcast
-- This enforces private messaging: players only see their own conversations
CREATE POLICY "participants_can_view_own_messages" ON messages
  FOR SELECT TO authenticated
  USING (
    is_room_participant(room_id) AND (
      sender_id IN (SELECT id FROM participants WHERE user_id = auth.uid()) OR
      recipient_id IN (SELECT id FROM participants WHERE user_id = auth.uid()) OR
      (is_broadcast = true)
    )
  );

-- Storyteller can view ALL messages in their room (oversight capability)
CREATE POLICY "storyteller_can_view_all_messages" ON messages
  FOR SELECT TO authenticated
  USING (is_room_storyteller(room_id));

-- Participants can send messages (sender must be their participant record)
CREATE POLICY "participants_can_send_messages" ON messages
  FOR INSERT TO authenticated
  WITH CHECK (
    is_room_participant(room_id) AND
    sender_id IN (SELECT id FROM participants WHERE user_id = auth.uid() AND is_active = true)
  );

-- ============================================================================
-- GRANT EXECUTE ON HELPER FUNCTIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION is_room_participant TO authenticated;
GRANT EXECUTE ON FUNCTION is_room_storyteller TO authenticated;
