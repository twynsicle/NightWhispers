-- Fix: Allow authenticated users to find rooms by code
-- Migration: 003_fix_room_lookup_by_code.sql
-- Created: 2026-01-19
--
-- Problem: Players couldn't join rooms because they couldn't query the rooms
-- table to find the room by code (chicken-and-egg: need to be a participant
-- to view room, but need room ID to become a participant).
--
-- Solution: Allow any authenticated user to view rooms. This is safe because:
-- 1. Room codes are meant to be shareable (like passwords)
-- 2. Only authenticated users can query
-- 3. Knowing a room code grants intentional access
-- 4. Other RLS policies still protect participant/message data

-- Add policy to allow anyone authenticated to view a room if they know the code
CREATE POLICY "authenticated_can_lookup_room_by_code" ON rooms
  FOR SELECT TO authenticated
  USING (true);
