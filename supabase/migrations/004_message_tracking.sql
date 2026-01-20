-- Add last_read_at timestamp for unread message tracking
-- Pattern from RESEARCH.md Pattern 3: Unread Message Tracking

ALTER TABLE participants
ADD COLUMN last_read_at TIMESTAMPTZ;

-- Index for efficient unread count queries
-- Query pattern: messages.created_at > participants.last_read_at
CREATE INDEX idx_participants_last_read_at ON participants(last_read_at);

COMMENT ON COLUMN participants.last_read_at IS 'Last time participant viewed messages. Used to calculate unread count.';
