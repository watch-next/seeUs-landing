-- Google authentication support for comments.
-- Reuses comment_users and the existing comment RPC surface, but teaches the
-- mutation/read functions to resolve either:
--   - the current Google Supabase Auth session (auth.uid()), or
--   - the anonymous browser token (p_anonymous_token).

CREATE OR REPLACE FUNCTION ensure_anonymous_comment_user(p_anonymous_token uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_user_id uuid;
BEGIN
    IF p_anonymous_token IS NULL THEN
        RAISE EXCEPTION 'p_anonymous_token is required';
    END IF;

    SELECT id INTO v_user_id
    FROM comment_users
    WHERE provider = 'anonymous'
      AND anonymous_token = p_anonymous_token
    LIMIT 1;

    IF v_user_id IS NULL THEN
        INSERT INTO comment_users (
            provider,
            anonymous_token,
            display_name,
            avatar_seed
        )
        VALUES (
            'anonymous',
            p_anonymous_token,
            'Anonymous',
            p_anonymous_token::text
        )
        RETURNING id INTO v_user_id;
    END IF;

    RETURN v_user_id;
END;
$$;

REVOKE ALL ON FUNCTION ensure_anonymous_comment_user(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION ensure_anonymous_comment_user(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION get_comment_user_for_request(p_anonymous_token uuid DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql STABLE AS $$
DECLARE
    v_user_id uuid;
BEGIN
    IF auth.uid() IS NOT NULL THEN
        SELECT id INTO v_user_id
        FROM comment_users
        WHERE provider = 'google'
          AND provider_user_id = auth.uid()::text
        LIMIT 1;

        IF v_user_id IS NOT NULL THEN
            RETURN v_user_id;
        END IF;
    END IF;

    IF p_anonymous_token IS NOT NULL THEN
        SELECT id INTO v_user_id
        FROM comment_users
        WHERE provider = 'anonymous'
          AND anonymous_token = p_anonymous_token
        LIMIT 1;

        IF v_user_id IS NOT NULL THEN
            RETURN v_user_id;
        END IF;

        v_user_id := ensure_anonymous_comment_user(p_anonymous_token);
        IF v_user_id IS NOT NULL THEN
            RETURN v_user_id;
        END IF;
    END IF;

    RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION upsert_comment_user_google(
    p_display_name text,
    p_avatar_url text DEFAULT NULL,
    p_email text DEFAULT NULL
) RETURNS comment_users LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_provider_user_id text;
    v_user comment_users;
BEGIN
    v_provider_user_id := auth.uid()::text;

    IF v_provider_user_id IS NULL THEN
        RAISE EXCEPTION 'Google session required';
    END IF;

    SELECT * INTO v_user
    FROM comment_users
    WHERE provider = 'google'
      AND provider_user_id = v_provider_user_id
    LIMIT 1;

    IF FOUND THEN
        UPDATE comment_users
        SET display_name = COALESCE(NULLIF(p_display_name, ''), display_name),
            avatar_seed = COALESCE(NULLIF(avatar_seed, ''), 'google-' || substr(md5(v_provider_user_id), 1, 12)),
            avatar_url = p_avatar_url,
            email = p_email
        WHERE id = v_user.id
        RETURNING * INTO v_user;
    ELSE
        INSERT INTO comment_users (
            provider,
            provider_user_id,
            display_name,
            avatar_seed,
            avatar_url,
            email
        )
        VALUES (
            'google',
            v_provider_user_id,
            COALESCE(NULLIF(p_display_name, ''), 'Google User'),
            'google-' || substr(md5(v_provider_user_id), 1, 12),
            p_avatar_url,
            p_email
        )
        RETURNING * INTO v_user;
    END IF;

    RETURN v_user;
END;
$$;

REVOKE ALL ON FUNCTION upsert_comment_user_google(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION upsert_comment_user_google(text, text, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION create_comment(
    p_post_slug        text,
    p_parent_id        uuid,
    p_content          text,
    p_anonymous_token  uuid,
    p_display_name     text,
    p_avatar_seed      text,
    p_mentions         jsonb DEFAULT '[]'::jsonb
) RETURNS comments LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_user_id  uuid;
    v_comment  comments;
    v_mention  jsonb;
BEGIN
    v_user_id := get_comment_user_for_request(p_anonymous_token);

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Comment user not found for the current session';
    END IF;

    IF auth.uid() IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM comment_users
        WHERE id = v_user_id
          AND provider = 'google'
    ) THEN
        RAISE EXCEPTION 'Google session not linked to a comment user';
    END IF;

    IF auth.uid() IS NULL AND NOT EXISTS (
        SELECT 1 FROM comment_users
        WHERE id = v_user_id
          AND provider = 'anonymous'
    ) THEN
        RAISE EXCEPTION 'Anonymous token not linked to a comment user';
    END IF;

    UPDATE comment_users
    SET display_name = CASE
            WHEN provider = 'anonymous' THEN p_display_name
            ELSE display_name
        END,
        avatar_seed = CASE
            WHEN provider = 'anonymous' THEN p_avatar_seed
            ELSE avatar_seed
        END
    WHERE id = v_user_id;

    IF p_parent_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM comments WHERE id = p_parent_id AND parent_id IS NOT NULL
    ) THEN
        RAISE EXCEPTION 'Replies are limited to two levels';
    END IF;

    INSERT INTO comments (post_slug, parent_id, user_id, content)
    VALUES (p_post_slug, p_parent_id, v_user_id, p_content)
    RETURNING * INTO v_comment;

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

REVOKE ALL ON FUNCTION create_comment(text, uuid, text, uuid, text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_comment(text, uuid, text, uuid, text, text, jsonb) TO anon, authenticated;

CREATE OR REPLACE FUNCTION update_comment(
    p_comment_id       uuid,
    p_content          text,
    p_anonymous_token  uuid,
    p_mentions         jsonb DEFAULT '[]'::jsonb
) RETURNS comments LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_comment  comments;
    v_mention  jsonb;
    v_user_id  uuid;
BEGIN
    SELECT * INTO v_comment FROM comments WHERE id = p_comment_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Comment not found'; END IF;
    IF v_comment.deleted_at IS NOT NULL THEN
        RAISE EXCEPTION 'Cannot edit a deleted comment';
    END IF;

    v_user_id := get_comment_user_for_request(p_anonymous_token);
    IF v_user_id IS NULL OR v_comment.user_id IS DISTINCT FROM v_user_id THEN
        RAISE EXCEPTION 'Not authorized to edit this comment';
    END IF;

    UPDATE comments
    SET content = p_content, edited = true
    WHERE id = p_comment_id
    RETURNING * INTO v_comment;

    DELETE FROM comment_mentions WHERE comment_id = p_comment_id;

    IF p_mentions IS NOT NULL AND jsonb_typeof(p_mentions) = 'array' THEN
        FOR v_mention IN SELECT jsonb_array_elements(p_mentions)
        LOOP
            INSERT INTO comment_mentions
                (comment_id, mentioned_user_id, mentioned_display_name,
                 start_index, end_index)
            VALUES (
                p_comment_id,
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

REVOKE ALL ON FUNCTION update_comment(uuid, text, uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION update_comment(uuid, text, uuid, jsonb) TO anon, authenticated;

CREATE OR REPLACE FUNCTION delete_comment(
    p_comment_id       uuid,
    p_anonymous_token  uuid
) RETURNS comments LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_comment  comments;
    v_user_id  uuid;
BEGIN
    SELECT * INTO v_comment FROM comments WHERE id = p_comment_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Comment not found'; END IF;

    v_user_id := get_comment_user_for_request(p_anonymous_token);
    IF v_user_id IS NULL OR v_comment.user_id IS DISTINCT FROM v_user_id THEN
        RAISE EXCEPTION 'Not authorized to delete this comment';
    END IF;

    UPDATE comments SET deleted_at = now()
    WHERE id = p_comment_id
    RETURNING * INTO v_comment;

    RETURN v_comment;
END;
$$;

REVOKE ALL ON FUNCTION delete_comment(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION delete_comment(uuid, uuid) TO anon, authenticated;

DROP FUNCTION IF EXISTS list_comments(text, timestamptz, integer);

CREATE OR REPLACE FUNCTION list_comments(
    p_post_slug         text,
    p_cursor            timestamptz DEFAULT now(),
    p_limit             integer DEFAULT 20,
    p_anonymous_token   uuid DEFAULT NULL
) RETURNS TABLE (
    comment_id                   uuid,
    post_slug                    text,
    parent_id                    uuid,
    user_id                      uuid,
    content                      text,
    created_at                   timestamptz,
    updated_at                   timestamptz,
    deleted_at                   timestamptz,
    edited                       boolean,
    comments_user_provider       text,
    comments_user_anonymous_token uuid,
    comments_user_display_name   text,
    comments_user_avatar_seed    text,
    comments_user_avatar_url     text,
    comment_count                bigint,
    like_count                   bigint,
    has_liked                    boolean
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
        COUNT(*) OVER ()              AS comment_count,
        (
            SELECT COUNT(*)::bigint FROM comment_likes
            WHERE comment_id = c.id
        )                             AS like_count,
        CASE
            WHEN get_comment_user_for_request(p_anonymous_token) IS NULL THEN false
            ELSE EXISTS (
                SELECT 1 FROM comment_likes
                WHERE comment_id = c.id
                  AND user_id = get_comment_user_for_request(p_anonymous_token)
            )
        END                           AS has_liked
    FROM comments c
    JOIN comment_users u ON u.id = c.user_id
    WHERE c.post_slug = p_post_slug
      AND c.created_at < p_cursor
    ORDER BY c.created_at DESC
    LIMIT GREATEST(1, LEAST(p_limit, 100));
$$;

GRANT EXECUTE ON FUNCTION list_comments(text, timestamptz, integer, uuid) TO anon, authenticated;

DROP FUNCTION IF EXISTS list_replies(uuid);

CREATE OR REPLACE FUNCTION list_replies(
    p_parent_id        uuid,
    p_anonymous_token  uuid DEFAULT NULL
) RETURNS TABLE (
    comment_id                   uuid,
    post_slug                    text,
    parent_id                    uuid,
    user_id                      uuid,
    content                      text,
    created_at                   timestamptz,
    updated_at                   timestamptz,
    deleted_at                   timestamptz,
    edited                       boolean,
    comments_user_provider       text,
    comments_user_anonymous_token uuid,
    comments_user_display_name   text,
    comments_user_avatar_seed    text,
    comments_user_avatar_url     text,
    like_count                   bigint,
    has_liked                    boolean
) LANGUAGE sql STABLE AS $$
    SELECT
        c.id, c.post_slug, c.parent_id, c.user_id,
        CASE WHEN c.deleted_at IS NULL THEN c.content ELSE '' END AS content,
        c.created_at, c.updated_at, c.deleted_at, c.edited,
        u.provider, u.anonymous_token, u.display_name, u.avatar_seed, u.avatar_url,
        (
            SELECT COUNT(*)::bigint FROM comment_likes
            WHERE comment_id = c.id
        )                             AS like_count,
        CASE
            WHEN get_comment_user_for_request(p_anonymous_token) IS NULL THEN false
            ELSE EXISTS (
                SELECT 1 FROM comment_likes
                WHERE comment_id = c.id
                  AND user_id = get_comment_user_for_request(p_anonymous_token)
            )
        END                           AS has_liked
    FROM comments c
    JOIN comment_users u ON u.id = c.user_id
    WHERE c.parent_id = p_parent_id
    ORDER BY c.created_at ASC
    LIMIT 200;
$$;

GRANT EXECUTE ON FUNCTION list_replies(uuid, uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION toggle_comment_like(
    p_comment_id       uuid,
    p_anonymous_token  uuid DEFAULT NULL
) RETURNS TABLE (liked boolean, like_count bigint)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_user_id  uuid;
    v_inserted uuid;
BEGIN
    v_user_id := get_comment_user_for_request(p_anonymous_token);
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Comment user not found for the current session';
    END IF;

    INSERT INTO comment_likes (comment_id, user_id)
    VALUES (p_comment_id, v_user_id)
    ON CONFLICT (comment_id, user_id) DO NOTHING
    RETURNING id INTO v_inserted;

    IF v_inserted IS NOT NULL THEN
        RETURN QUERY SELECT true, COUNT(*)::bigint
                     FROM comment_likes WHERE comment_id = p_comment_id;
    ELSE
        DELETE FROM comment_likes
        WHERE comment_id = p_comment_id AND user_id = v_user_id;
        RETURN QUERY SELECT false, COUNT(*)::bigint
                     FROM comment_likes WHERE comment_id = p_comment_id;
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION toggle_comment_like(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION toggle_comment_like(uuid, uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION report_comment(
    p_comment_id       uuid,
    p_category         text,
    p_anonymous_token  uuid DEFAULT NULL,
    p_reason           text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER AS $$
DECLARE
    v_reporter_id  uuid;
    v_inserted     uuid;
BEGIN
    IF p_category NOT IN ('spam', 'harassment', 'offensive_language', 'other') THEN
        RAISE EXCEPTION 'Invalid report category: %', p_category;
    END IF;

    v_reporter_id := get_comment_user_for_request(p_anonymous_token);

    IF v_reporter_id IS NULL THEN
        RAISE EXCEPTION 'Comment user not found for the current session';
    END IF;

    INSERT INTO comment_reports (
        comment_id,
        reporter_user_id,
        category,
        reason
    )
    VALUES (
        p_comment_id,
        v_reporter_id,
        p_category,
        p_reason
    )
    ON CONFLICT (comment_id, reporter_user_id)
    DO NOTHING
    RETURNING id INTO v_inserted;

    RETURN v_inserted IS NOT NULL;
END;
$$;

REVOKE ALL ON FUNCTION report_comment(uuid, uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION report_comment(uuid, uuid, text, text) TO anon, authenticated;
