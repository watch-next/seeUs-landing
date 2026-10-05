-- Update list_comments function to support content_type/content_id
-- For backward compatibility, we allow queries by either:
-- 1. content_type='blog_post' AND content_id=post_slug (new way)
-- 2. content_type IS NULL AND post_slug=post_slug (old way for existing data during migration)
-- After running the data migration populating content_type/content_id, the old way will no longer match

DROP FUNCTION IF EXISTS list_comments(text, text, timestamptz, integer);

CREATE OR REPLACE FUNCTION list_comments(
    p_content_type  text,
    p_content_id    text,
    p_cursor        timestamptz DEFAULT now(),
    p_limit         integer DEFAULT 20
) RETURNS TABLE (
    comment_id                  uuid,
    post_slug                   text,
    parent_id                   uuid,
    user_id                     uuid,
    content                     text,
    created_at                  timestamptz,
    updated_at                  timestamptz,
    deleted_at                  timestamptz,
    edited                      boolean,
    comments_user_provider      text,
    comments_user_anonymous_token uuid,
    comments_user_display_name  text,
    comments_user_avatar_seed   text,
    comments_user_avatar_url    text,
    comment_count              bigint
) LANGUAGE sql STABLE AS $$
    SELECT
        c.id                          AS comment_id,
        c.post_slug                   AS post_slug,
        c.parent_id                   AS parent_id,
        c.user_id                     AS user_id,
        CASE WHEN c.deleted_at IS NULL THEN c.content ELSE '' END AS content,
        c.created_at,
        c.updated_at,
        c.deleted_at,
        c.edited,
        u.provider                    AS comments_user_provider,
        u.anonymous_token             AS comments_user_anonymous_token,
        u.display_name                AS comments_user_display_name,
        u.avatar_seed                 AS comments_user_avatar_seed,
        u.avatar_url                  AS comments_user_avatar_url,
        COUNT(*) OVER ()              AS comment_count
    FROM comments c
    JOIN comment_users u ON u.id = c.user_id
    WHERE
      -- New way: match by content_type and content_id (for Movies, TV Shows, and migrated Blog Posts)
      (c.content_type = p_content_type AND c.content_id = p_content_id)
      -- Old way for backward compatibility during transition:
      -- (This will only match if content_type is NULL, which should be rare after data migration)
      OR (c.content_type IS NULL AND c.post_slug = p_content_id AND p_content_type = 'blog_post')
    AND c.created_at < p_cursor
    ORDER BY c.created_at DESC
    LIMIT GREATEST(1, LEAST(p_limit, 100));
$$;

GRANT EXECUTE ON FUNCTION list_comments(text, text, timestamptz, integer) TO anon, authenticated;