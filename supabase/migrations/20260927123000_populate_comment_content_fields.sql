-- Populate content_type and content_id for existing comments
-- Set all existing comments to content_type='blog_post' and content_id=post_slug
-- This preserves backward compatibility while enabling new content types

UPDATE comments
SET
    content_type = 'blog_post',
    content_id = post_slug
WHERE content_type IS NULL;

-- Make the columns NOT NULL now that all rows have values
ALTER TABLE comments
ALTER COLUMN content_type SET NOT NULL,
ALTER COLUMN content_id SET NOT NULL;

-- Add index for efficient querying
CREATE INDEX IF NOT EXISTS idx_comments_content_type_id ON comments(content_type, content_id);