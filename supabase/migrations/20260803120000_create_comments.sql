-- Blog comments system
-- Reconciled to match the type/service contract in:
--   src/types/comments.ts
--   src/services/comments/comments.service.ts
--   src/composables/useComments.ts
-- Anonymous commenters own their content via a UUID stored in localStorage
-- (seeus:anonymous_id). Mutations flow through SECURITY DEFINER functions
-- that enforce ownership. RLS allows public SELECT; direct INSERT / UPDATE
-- / DELETE are denied to anon / authenticated.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- comment_users
-- =============================================================================
CREATE TABLE IF NOT EXISTS comment_users (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider          text NOT NULL
                      CHECK (provider IN ('anonymous', 'facebook', 'google', 'github')),
    provider_user_id  text,
    anonymous_token   uuid,
    display_name      text NOT NULL,
    avatar_seed       text NOT NULL,
    avatar_url        text,
    email             text,
    created_at        timestamptz NOT NULL DEFAULT now(),
    updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_comment_users_social
    ON comment_users (provider, provider_user_id)
    WHERE provider <> 'anonymous';

CREATE UNIQUE INDEX IF NOT EXISTS ux_comment_users_anonymous
    ON comment_users (provider, anonymous_token)
    WHERE provider = 'anonymous';

-- =============================================================================
-- comments
-- =============================================================================
CREATE TABLE IF NOT EXISTS comments (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_slug   text NOT NULL,
    parent_id   uuid REFERENCES comments(id) ON DELETE RESTRICT,
    user_id     uuid NOT NULL REFERENCES comment_users(id) ON DELETE CASCADE,
    content     text NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),
    deleted_at  timestamptz,
    edited      boolean NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_comments_post_slug
    ON comments (post_slug, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_parent
    ON comments (parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_user
    ON comments (user_id);

-- =============================================================================
-- comment_mentions
-- =============================================================================
CREATE TABLE IF NOT EXISTS comment_mentions (
    id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id             uuid NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    mentioned_user_id      uuid REFERENCES comment_users(id) ON DELETE SET NULL,
    mentioned_display_name text NOT NULL,
    start_index            integer NOT NULL,
    end_index              integer NOT NULL,
    CHECK (start_index >= 0 AND end_index > start_index)
);

CREATE INDEX IF NOT EXISTS idx_comment_mentions_comment
    ON comment_mentions (comment_id);

-- =============================================================================
-- Row Level Security
-- =============================================================================
ALTER TABLE comment_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_mentions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comment_users_public_read" ON comment_users FOR SELECT USING (true);
CREATE POLICY "comments_public_read"        ON comments      FOR SELECT USING (true);
CREATE POLICY "comment_mentions_public_read" ON comment_mentions FOR SELECT USING (true);

GRANT SELECT ON comment_users   TO anon, authenticated;
GRANT SELECT ON comments         TO anon, authenticated;
GRANT SELECT ON comment_mentions TO anon, authenticated;

-- =============================================================================
-- updated_at trigger fn — idempotent; re-declared if missing in this database.
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_comment_users_updated_at ON comment_users;
CREATE TRIGGER update_comment_users_updated_at
    BEFORE UPDATE ON comment_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
CREATE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- get_comment_user_by_anon_token
-- =============================================================================
CREATE OR REPLACE FUNCTION get_comment_user_by_anon_token(p_anonymous_token uuid)
RETURNS uuid LANGUAGE sql STABLE AS $$
    SELECT id FROM comment_users
    WHERE provider = 'anonymous' AND anonymous_token = p_anonymous_token
    LIMIT 1;
$$;

-- =============================================================================
-- create_comment
-- Args match CreateCommentInput in src/types/comments.ts.
-- p_mentions is a JSON array of:
--   { "mentionedUserId": uuid|null, "mentionedDisplayName": text,
--     "startIndex": int, "endIndex": int }
-- =============================================================================
CREATE OR REPLACE FUNCTION create_comment(
    p_post_slug        text,
    p_parent_id        uuid,
    p_content         text,
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

    INSERT INTO comments (post_slug, parent_id, user_id, content)
    VALUES (p_post_slug, p_parent_id, v_user_id, p_content)
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

REVOKE ALL ON FUNCTION create_comment(text, uuid, text, uuid, text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_comment(text, uuid, text, uuid, text, text, jsonb) TO anon, authenticated;

-- =============================================================================
-- update_comment
-- =============================================================================
CREATE OR REPLACE FUNCTION update_comment(
    p_comment_id       uuid,
    p_content          text,
    p_anonymous_token  uuid,
    p_mentions         jsonb DEFAULT '[]'::jsonb
) RETURNS comments LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_comment  comments;
    v_mention  jsonb;
BEGIN
    SELECT * INTO v_comment FROM comments WHERE id = p_comment_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Comment not found'; END IF;
    IF v_comment.deleted_at IS NOT NULL THEN
        RAISE EXCEPTION 'Cannot edit a deleted comment';
    END IF;
    IF v_comment.user_id IS DISTINCT FROM get_comment_user_by_anon_token(p_anonymous_token) THEN
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

-- =============================================================================
-- delete_comment — soft delete, preserves replies.
-- =============================================================================
CREATE OR REPLACE FUNCTION delete_comment(
    p_comment_id       uuid,
    p_anonymous_token  uuid
) RETURNS comments LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_comment  comments;
BEGIN
    SELECT * INTO v_comment FROM comments WHERE id = p_comment_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Comment not found'; END IF;
    IF v_comment.user_id IS DISTINCT FROM get_comment_user_by_anon_token(p_anonymous_token) THEN
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

-- =============================================================================
-- list_comments
-- Cursor-paginated, newest-first. Returns top-level + replies for the slug.
-- A wrapper window function provides total count of all comments for the slug
-- so the client can render "X total comments" without a second round trip.
-- Returns one row per comment; the client groups by parent_id.
-- =============================================================================
CREATE OR REPLACE FUNCTION list_comments(
    p_post_slug  text,
    p_cursor     timestamptz DEFAULT now(),
    p_limit      integer DEFAULT 20
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
    WHERE c.post_slug = p_post_slug
      AND c.created_at < p_cursor
    ORDER BY c.created_at DESC
    LIMIT GREATEST(1, LEAST(p_limit, 100));
$$;

GRANT EXECUTE ON FUNCTION list_comments(text, timestamptz, integer) TO anon, authenticated;

-- =============================================================================
-- list_replies
-- Returns all replies for a top-level comment (capped at 200 for safety).
-- =============================================================================
CREATE OR REPLACE FUNCTION list_replies(
    p_parent_id  uuid
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
    comments_user_avatar_url    text
) LANGUAGE sql STABLE AS $$
    SELECT
        c.id, c.post_slug, c.parent_id, c.user_id,
        CASE WHEN c.deleted_at IS NULL THEN c.content ELSE '' END AS content,
        c.created_at, c.updated_at, c.deleted_at, c.edited,
        u.provider, u.anonymous_token, u.display_name, u.avatar_seed, u.avatar_url
    FROM comments c
    JOIN comment_users u ON u.id = c.user_id
    WHERE c.parent_id = p_parent_id
    ORDER BY c.created_at ASC
    LIMIT 200;
$$;

GRANT EXECUTE ON FUNCTION list_replies(uuid) TO anon, authenticated;

-- =============================================================================
-- search_commenters
-- Autocomplete for @mentions. Scoped to users who already commented on THIS
-- article (deterministic, avoids exposing the global user list).
-- =============================================================================
CREATE OR REPLACE FUNCTION search_commenters(
    p_post_slug  text,
    p_query      text
) RETURNS TABLE (
    user_id      uuid,
    display_name text,
    avatar_seed  text
) LANGUAGE sql STABLE AS $$
    SELECT DISTINCT ON (cu.display_name)
           cu.id, cu.display_name, cu.avatar_seed
    FROM comment_users cu
    JOIN comments c ON c.user_id = cu.id
    WHERE c.post_slug = p_post_slug
      AND cu.display_name ILIKE p_query || '%'
    ORDER BY cu.display_name ASC
    LIMIT 20;
$$;

GRANT EXECUTE ON FUNCTION search_commenters(text, text) TO anon, authenticated;

-- =============================================================================
-- Comments
-- =============================================================================
COMMENT ON TABLE comment_users IS 'Isolated identity for blog commenters. Independent of admin Supabase Auth.';
COMMENT ON TABLE comments IS 'Blog comments. parent_id NULL = top-level. Two-level nesting only.';
COMMENT ON TABLE comment_mentions IS 'Structured mention metadata for rendering @mentions.';
