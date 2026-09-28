-- Add content_type and content_id to support Movies and TV Shows
-- Preserve backward compatibility with existing blog_post comments via post_slug

-- Add new columns for content identification
ALTER TABLE comments
ADD COLUMN IF NOT EXISTS content_type text,
ADD COLUMN IF NOT EXISTS content_id text;

-- Update existing blog_post comments to set content_type and content_id
-- For backward compatibility, we'll set content_type='blog_post' and content_id=post_slug
UPDATE comments
SET
    content_type = 'blog_post',
    content_id = post_slug
WHERE content_type IS NULL;

-- Make the new columns NOT NULL after populating existing data
ALTER TABLE comments
ALTER COLUMN content_type SET NOT NULL,
ALTER COLUMN content_id SET NOT NULL;

-- Add index for efficient querying by content type and ID
CREATE INDEX IF NOT EXISTS idx_comments_content_type_id ON comments(content_type, content_id);

-- Update RLS policies if needed (comments.service.ts uses postSlug in WHERE clause)
-- The existing RLS policies that reference post_slug in USING clauses will still work
-- for blog_post content_type because we populate content_id with post_slug
-- For new content types, we need to update policies to check content_id instead of post_slug
-- when content_type is not 'blog_post'

-- Note: The comments.service.ts functions need to be updated to use content_type/content_id
-- instead of post_slug when available, falling back to post_slug for backward compatibility