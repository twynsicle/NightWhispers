-- Push notification subscriptions
-- Stores Web Push subscriptions per participant

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,  -- Public key for encryption
  auth TEXT NOT NULL,     -- Authentication secret
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One subscription per endpoint (handles re-subscription)
  UNIQUE(endpoint)
);

-- Index for efficient lookups by participant
CREATE INDEX idx_push_subscriptions_participant
  ON push_subscriptions(participant_id);

-- RLS policies
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can manage their own subscriptions
CREATE POLICY "Users can insert own subscriptions"
  ON push_subscriptions FOR INSERT
  WITH CHECK (
    participant_id IN (
      SELECT id FROM participants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view own subscriptions"
  ON push_subscriptions FOR SELECT
  USING (
    participant_id IN (
      SELECT id FROM participants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own subscriptions"
  ON push_subscriptions FOR DELETE
  USING (
    participant_id IN (
      SELECT id FROM participants WHERE user_id = auth.uid()
    )
  );

-- Service role can read all (for Edge Function)
-- Note: Edge Functions use service_role key which bypasses RLS
