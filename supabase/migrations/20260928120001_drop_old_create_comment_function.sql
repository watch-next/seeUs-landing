-- Drop the old create_comment function (7 arguments) to avoid overload conflict
-- and ensure only the new 9-argument function (with defaults) is used.
DROP FUNCTION IF EXISTS create_comment(text, uuid, text, uuid, text, text, jsonb);