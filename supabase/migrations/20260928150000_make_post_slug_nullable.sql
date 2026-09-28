-- Make post_slug nullable to support content_type/content_id based comments
-- This allows comments for movies, TV shows, etc. without requiring a post_slug
ALTER TABLE comments
ALTER COLUMN post_slug DROP NOT NULL;