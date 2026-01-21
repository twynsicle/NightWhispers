-- Night Whispers Initial Database Schema
-- Migration: 001_initial_schema.sql
-- Created: 2026-01-19
--
-- Tables: rooms, participants, messages
-- All timestamps in UTC (TIMESTAMPTZ)
-- Cascading deletes ensure room deletion cleans up all data

-- ============================================================================
-- ROOMS TABLE
-- ============================================================================
-- Central table for game sessions
-- 4-character uppercase code for easy sharing
-- Status tracks game lifecycle: lobby -> active -> ended

CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code CHAR(4) NOT NULL UNIQUE,
  storyteller_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'lobby' CHECK (status IN ('lobby', 'active', 'ended')),
  phase TEXT NOT NULL DEFAULT 'Night 1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '1 hour'),
  CONSTRAINT code_uppercase CHECK (code = UPPER(code))
);

-- Index for room code lookups (players joining)
CREATE INDEX idx_rooms_code ON rooms(code);

-- Index for cleanup queries (expired rooms)
CREATE INDEX idx_rooms_expires_at ON rooms(expires_at);

-- ============================================================================
-- PARTICIPANTS TABLE
-- ============================================================================
-- Users in a room (storyteller + players)
-- role: storyteller or player
-- status: alive or dead (for game state)
-- is_active: false when kicked or left

CREATE TABLE participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  display_name TEXT NOT NULL,
  avatar_id TEXT,
  role TEXT NOT NULL DEFAULT 'player' CHECK (role IN ('storyteller', 'player')),
  status TEXT NOT NULL DEFAULT 'alive' CHECK (status IN ('alive', 'dead')),
  custom_status TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- Index for fetching participants by room
CREATE INDEX idx_participants_room_id ON participants(room_id);

-- Index for looking up user's active rooms
CREATE INDEX idx_participants_user_id ON participants(user_id);

-- ============================================================================
-- MESSAGES TABLE
-- ============================================================================
-- Private messages between storyteller and players
-- recipient_id NULL = Storyteller broadcast (visible to all players)
-- is_broadcast flag for explicit broadcast messages

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES participants(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_broadcast BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fetching messages by room (message history)
CREATE INDEX idx_messages_room_id ON messages(room_id);

-- Index for fetching messages sent by a participant
CREATE INDEX idx_messages_sender_id ON messages(sender_id);

-- Index for fetching messages received by a participant
CREATE INDEX idx_messages_recipient_id ON messages(recipient_id);

-- Index for ordering messages chronologically
CREATE INDEX idx_messages_created_at ON messages(created_at);
