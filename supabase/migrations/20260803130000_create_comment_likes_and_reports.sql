-- Comment likes + reports
-- Adds two new tables and two SECURITY DEFINER mutation functions, and
-- extends list_comments / list_replies to return like_count + has_liked
-- so the client can render a Like button with one round trip.
--
-- RLS conventions match 20260803120000_create_comments.sql:
--   - comment_likes: public SELECT (counters need reads); no direct
--     INSERT/DELETE to client roles — only toggle_comment_like mutates.
--   - comment_reports: insert-only via SECURITY DEFINER; no client SELECT.
--
-- Reused helpers from the prior migration:
--   - get_comment_user_by_anon_token(uuid) for ownership resolution.
--   - update_updated_at_column() is NOT needed (new tables have no
--     updated_at column for MVP).

CREATE OR REPLACE FUNCTION ensure_anonymous_comment_user(p_anonymous_token uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_user_id uuid;
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

-- =============================================================================
-- comment_likes
-- =============================================================================
CREATE TABLE IF NOT EXISTS comment_likes (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id  uuid NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    user_id     uuid NOT NULL REFERENCES comment_users(id) ON DELETE CASCADE,
    created_at  timestamptz NOT NULL DEFAULT now(),
    UNIQUE (comment_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_comment_likes_comment
    ON comment_likes (comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user
    ON comment_likes (user_id);

-- =============================================================================
-- comment_reports — insert-only from the client. No SELECT policy.
-- One report per (comment, reporter) — idempotent re-reporting returns false.
-- =============================================================================
CREATE TABLE IF NOT EXISTS comment_reports (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id         uuid NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    reporter_user_id   uuid NOT NULL REFERENCES comment_users(id) ON DELETE CASCADE,
    category           text NOT NULL
                       CHECK (category IN ('spam', 'harassment', 'offensive_language', 'other')),
    reason             text CHECK (length(reason) <= 2000),
    created_at         timestamptz NOT NULL DEFAULT now(),
    UNIQUE (comment_id, reporter_user_id)
);

CREATE INDEX IF NOT EXISTS idx_comment_reports_comment
    ON comment_reports (comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_reports_created_at
    ON comment_reports (created_at DESC);

-- =============================================================================
-- Row Level Security
-- =============================================================================
ALTER TABLE comment_likes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_reports ENABLE ROW LEVEL SECURITY;

-- comment_likes: public read (counters resolve in list_comments); no INSERT
-- / DELETE grant — toggle_comment_like mutates under SECURITY DEFINER.
CREATE POLICY "comment_likes_public_read" ON comment_likes FOR SELECT USING (true);
GRANT SELECT ON comment_likes TO anon, authenticated;

-- comment_reports: NO SELECT policy and NO SELECT grant — reports are
-- invisible to the client. The report_comment SECURITY DEFINER function
-- bypasses RLS to insert. A future admin role may add a FOR SELECT policy
-- gated on is_admin() (see 20260707000000_add_admin_support.sql).

-- =============================================================================
-- toggle_comment_like
-- Idempotent toggle: INSERT … ON CONFLICT DO NOTHING. If a row was inserted,
-- liked = true; else DELETE the existing row, liked = false. Returns the new
-- total like_count for the comment so the client can update sync in one RPC.
-- =============================================================================
CREATE OR REPLACE FUNCTION toggle_comment_like(
    p_comment_id       uuid,
    p_anonymous_token  uuid
) RETURNS TABLE (liked boolean, like_count bigint)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_user_id  uuid;
    v_inserted uuid;
BEGIN
    v_user_id := ensure_anonymous_comment_user(p_anonymous_token);

    INSERT INTO comment_likes (comment_id, user_id)
    VALUES (p_comment_id, v_user_id)
    ON CONFLICT (comment_id, user_id) DO NOTHING
    RETURNING id INTO v_inserted;

    IF v_inserted IS NOT NULL THEN
        -- Newly liked.
        RETURN QUERY SELECT true, COUNT(*)::bigint
                     FROM comment_likes WHERE comment_id = p_comment_id;
    ELSE
        -- Was already liked — unlike.
        DELETE FROM comment_likes
        WHERE comment_id = p_comment_id AND user_id = v_user_id;
        RETURN QUERY SELECT false, COUNT(*)::bigint
                     FROM comment_likes WHERE comment_id = p_comment_id;
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION toggle_comment_like(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION toggle_comment_like(uuid, uuid) TO anon, authenticated;

-- =============================================================================
-- report_comment
-- Idempotent: INSERT … ON CONFLICT (comment_id, reporter_user_id) DO NOTHING.
-- Returns true if a new report was created, false if this reporter already
-- reported this comment.
-- =============================================================================
CREATE OR REPLACE FUNCTION report_comment(
    p_comment_id        uuid,
    p_anonymous_token   uuid,
    p_category          text,
    p_reason            text DEFAULT NULL
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_reporter_id  uuid;
    v_inserted     uuid;
BEGIN
    IF p_category NOT IN ('spam', 'harassment', 'offensive_language', 'other') THEN
        RAISE EXCEPTION 'Invalid report category: %', p_category;
    END IF;

    v_reporter_id := ensure_anonymous_comment_user(p_anonymous_token);

    INSERT INTO comment_reports (comment_id, reporter_user_id, category, reason)
    VALUES (p_comment_id, v_reporter_id, p_category, p_reason)
    ON CONFLICT (comment_id, reporter_user_id) DO NOTHING
    RETURNING id INTO v_inserted;

    RETURN v_inserted IS NOT NULL;
END;
$$;

REVOKE ALL ON FUNCTION report_comment(uuid, uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION report_comment(uuid, uuid, text, text) TO anon, authenticated;

-- =============================================================================
-- list_comments (replacement) — adds like_count + has_liked.
-- p_anonymous_token is OPTIONAL (default NULL) so existing callers keep
-- working without changes. When NULL, has_liked resolves to false for every
-- row (no live identity).
-- =============================================================================
DROP FUNCTION IF EXISTS list_comments(text, timestamptz, integer);

CREATE OR REPLACE FUNCTION list_comments(
    p_post_slug         text,
    p_cursor            timestamptz DEFAULT now(),
    p_limit             integer DEFAULT 20,
    p_anonymous_token   uuid DEFAULT NULL
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
    comment_count               bigint,
    like_count                  bigint,
    has_liked                   boolean
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
        CASE WHEN p_anonymous_token IS NULL THEN false ELSE EXISTS (
            SELECT 1 FROM comment_likes
            WHERE comment_id = c.id
              AND user_id = get_comment_user_by_anon_token(p_anonymous_token)
        ) END                         AS has_liked
    FROM comments c
    JOIN comment_users u ON u.id = c.user_id
    WHERE c.post_slug = p_post_slug
      AND c.created_at < p_cursor
    ORDER BY c.created_at DESC
    LIMIT GREATEST(1, LEAST(p_limit, 100));
$$;

GRANT EXECUTE ON FUNCTION list_comments(text, timestamptz, integer, uuid) TO anon, authenticated;

-- =============================================================================
-- list_replies (replacement) — adds like_count + has_liked.
-- Same optionality pattern for p_anonymous_token.
-- =============================================================================
DROP FUNCTION IF EXISTS list_replies(uuid);

CREATE OR REPLACE FUNCTION list_replies(
    p_parent_id        uuid,
    p_anonymous_token  uuid DEFAULT NULL
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
    like_count                  bigint,
    has_liked                   boolean
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
        CASE WHEN p_anonymous_token IS NULL THEN false ELSE EXISTS (
            SELECT 1 FROM comment_likes
            WHERE comment_id = c.id
              AND user_id = get_comment_user_by_anon_token(p_anonymous_token)
        ) END                         AS has_liked
    FROM comments c
    JOIN comment_users u ON u.id = c.user_id
    WHERE c.parent_id = p_parent_id
    ORDER BY c.created_at ASC
    LIMIT 200;
$$;

GRANT EXECUTE ON FUNCTION list_replies(uuid, uuid) TO anon, authenticated;

-- =============================================================================
-- Comments
-- =============================================================================
COMMENT ON TABLE comment_likes IS 'Anonymous + future social likes. One like per (comment, user). Mutations via toggle_comment_like only.';
COMMENT ON TABLE comment_reports IS 'Lightweight comment reports. Insert-only via report_comment. Not exposed to client SELECT.';
