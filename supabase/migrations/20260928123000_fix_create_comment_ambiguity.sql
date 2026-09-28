-- Fix create_comment function overload ambiguity
-- Drop all existing conflicting versions and create one canonical function

DROP FUNCTION IF EXISTS create_comment(text, uuid, text, uuid, text, text, jsonb);
DROP FUNCTION IF EXISTS create_comment(uuid, text, uuid, text, text, uuid, text, jsonb, text, text);
DROP FUNCTION IF EXISTS create_comment(text, uuid, text, uuid, text, text, jsonb, text, text);
DROP FUNCTION IF EXISTS create_comment(uuid, text, text, uuid, text, text, uuid, text, jsonb, text, text);

-- Create canonical function that supports both calling conventions:
-- 1. Legacy: p_post_slug provided (for blog posts)
-- 2. New: p_content_type and p_content_id provided (for movies/tv_shows)
CREATE OR REPLACE FUNCTION create_comment(
    p_parent_id        uuid,
    p_content         text,
    p_display_name    text,
    p_avatar_seed     text,
    p_anonymous_token uuid,
    p_mentions        jsonb DEFAULT '[]'::jsonb,
    p_post_slug       text DEFAULT NULL,
    p_content_type    text DEFAULT NULL,
    p_content_id      text DEFAULT NULL
) RETURNS comments LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_user_id  uuid;
    v_comment  comments;
    v_mention  jsonb;
BEGIN
    -- Validate that we have either post_slug OR (content_type and content_id)
    IF p_post_slug IS NULL AND (p_content_type IS NULL OR p_content_id IS NULL) THEN
        RAISE EXCEPTION 'Either p_post_slug must be provided, or both p_content_type and p_content_id must be provided';
    END IF;

    IF p_anonymous_token IS NULL THEN
        RAISE EXCEPTION 'p_anonymous_token is required';
    END IF;

    -- Get or create the user
    SELECT id INTO v_user_id FROM comment_users
    WHERE provider = 'anonymous' AND anonymous_token = p_anonymous_token
    LIMIT 1;

    IF v_user_id IS NULL THEN
        INSERT INTO comment_users
            (provider, anonymous_token, display_name, avatar_seed)
        VALUES ('anonymous', p_anonymous_token, p_display_name, p_avatar_seed)
        RETURNING id INTO v_user_id;
    ELSE
        UPDATE comment_users
        SET display_name = p_display_name,
            avatar_seed = p_avatar_seed
        WHERE id = v_user_id;
    END IF;

    -- Insert the comment
    INSERT INTO comments (
        post_slug,
        content_type,
        content_id,
        parent_id,
        user_id,
        content
    ) VALUES (
        COALESCE(p_post_slug, p_content_id),
        COALESCE(p_content_type, 'blog_post'),
        COALESCE(p_content_id, p_post_slug),
        p_parent_id,
        v_user_id,
        p_content
    )
    RETURNING * INTO v_comment;

    -- Handle mentions if provided
    IF p_mentions IS NOT NULL AND jsonb_typeof(p_mentions) = 'array' THEN
        FOR v_mention IN SELECT jsonb_array_elements(p_mentions)
        LOOP
            INSERT INTO comment_mentions
                (comment_id, mentioned_user_id, mentioned_display_name,
                 start_index, end_index)
            VALUES (
                v_comment.id,
                NULLIF(v_mention->>'mentionedUserId', '')::uuid,
                v_mention->>'mentionedDisplayName',
                (v_mention->>'startIndex')::integer,
                (v_mention->>'endIndex')::integer
            );
        END LOOP;
    END IF;

    RETURN v_comment;
END;
$$;

-- Update permissions
REVOKE ALL ON FUNCTION create_comment(uuid, text, text, text, text, uuid, jsonb, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_comment(uuid, text, text, text, text, uuid, jsonb, text, text, text) TO anon, authenticated;