-- Add index for efficient participant ordering queries
-- Migration: 006_participant_sort_order_index.sql
-- Created: 2026-01-20
--
-- Supports drag-and-drop reordering (DASH-05)

-- Create composite index for efficient ordering within a room
-- Used by: useParticipants hook sorting, StorytellerDashboard player order
CREATE INDEX IF NOT EXISTS idx_participants_room_sort_order
  ON participants(room_id, sort_order);

-- Note: sort_order column already exists from 001_initial_schema.sql with DEFAULT 0
