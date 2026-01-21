-- Database function to mark conversation as read using server timestamp
-- Fixes clock skew issues by using NOW() instead of client timestamp

CREATE OR REPLACE FUNCTION mark_conversation_read(p_participant_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE participants
  SET last_read_at = NOW()
  WHERE id = p_participant_id;
END;
$$;

COMMENT ON FUNCTION mark_conversation_read IS 'Updates last_read_at to database server time (NOW()) to prevent clock skew issues';
