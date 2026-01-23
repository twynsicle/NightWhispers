-- Enable Realtime for participants and rooms tables
-- Migration: 20260122000001_enable_realtime.sql
-- Created: 2026-01-22
--
-- Supabase Realtime requires tables to be added to the supabase_realtime publication
-- for Postgres Changes (INSERT/UPDATE/DELETE events) to be broadcast to clients.
--
-- This enables:
-- - Real-time participant list updates when players join/leave
-- - Real-time room status changes (lobby -> active -> ended)

-- Add participants table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE participants;

-- Add rooms table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;

-- Add messages table to realtime publication (for future real-time chat)
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
