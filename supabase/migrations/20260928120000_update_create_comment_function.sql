-- Update create_comment function to support content_type and content_id
CREATE OR REPLACE FUNCTION create_comment(
    p_post_slug        text,
    p_parent_id        uuid,
    p_content         text,
    p_anonymous_token  uuid,
    p_display_name     text,
    p_avatar_seed      text,
    p_mentions         jsonb DEFAULT '[]'::jsonb,
    p_content_type     text DEFAULT NULL,
    p_content_id       text DEFAULT NULL
) RETURNS comments LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_user_id  uuid;
    v_comment  comments;
    v_mention  jsonb;
BEGIN
    IF p_anonymous_token IS NULL THEN
        RAISE EXCEPTION 'p_anonymous_token is required';
    END IF;

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
            avatar_seed   = p_avatar_seed
        WHERE id = v_user_id;
    END IF;

    -- Enforce two-level nesting.
    IF p_parent_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM comments WHERE id = p_parent_id AND parent_id IS NOT NULL
    ) THEN
        RAISE EXCEPTION 'Replies are limited to two levels';
    END IF;

    INSERT INTO comments (post_slug, parent_id, user_id, content, content_type, content_id)
    VALUES (p_post_slug, p_parent_id, v_user_id, p_content,
            COALESCE(p_content_type, 'blog_post'),
            COALESCE(p_content_id, p_post_slug))
    RETURNING * INTO v_comment;

    -- Guard against a scalar jsonb payload (SQLSTATE 22023 "cannot extract
    -- elements from a scalar"). The frontend sends a real JS array, but this
    -- gate makes the function robust to any future caller that passes a
    -- stringified scalar by mistake.
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

REVOKE ALL ON FUNCTION create_comment(text, uuid, text, uuid, text, text, jsonb, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_comment(text, uuid, text, uuid, text, text, jsonb, text, text) TO anon, authenticated;