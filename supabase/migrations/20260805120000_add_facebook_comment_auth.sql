-- Facebook comment identity support
-- Mirrors upsert_comment_user_google — upserts the Facebook commenter profile
-- using auth.uid() as the provider_user_id.

CREATE OR REPLACE FUNCTION upsert_comment_user_facebook(
    p_display_name text,
    p_avatar_url text DEFAULT NULL,
    p_email text DEFAULT NULL
) RETURNS comment_users
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_provider_user_id text;
    v_user comment_users;
BEGIN
    v_provider_user_id := auth.uid()::text;

    IF v_provider_user_id IS NULL THEN
        RAISE EXCEPTION 'Facebook session required';
    END IF;

    SELECT *
    INTO v_user
    FROM comment_users
    WHERE provider = 'facebook'
      AND provider_user_id = v_provider_user_id
    LIMIT 1;

    IF FOUND THEN
        UPDATE comment_users
        SET display_name = COALESCE(NULLIF(p_display_name, ''), display_name),
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
            'facebook',
            v_provider_user_id,
            COALESCE(NULLIF(p_display_name, ''), 'Facebook User'),
            'facebook-' || substr(md5(v_provider_user_id), 1, 12),
            p_avatar_url,
            p_email
        )
        RETURNING * INTO v_user;
    END IF;

    RETURN v_user;
END;
$$;

REVOKE ALL ON FUNCTION upsert_comment_user_facebook(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION upsert_comment_user_facebook(text, text, text) TO anon, authenticated;

-- Update get_comment_user_for_request to also look up Facebook users
-- alongside Google users (both identified by auth.uid()).
CREATE OR REPLACE FUNCTION get_comment_user_for_request(p_anonymous_token uuid DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_user_id uuid;
BEGIN
    IF auth.uid() IS NOT NULL THEN
        -- Try Google first.
        SELECT id INTO v_user_id
        FROM comment_users
        WHERE provider = 'google'
          AND provider_user_id = auth.uid()::text
        LIMIT 1;

        IF v_user_id IS NOT NULL THEN
            RETURN v_user_id;
        END IF;

        -- Try Facebook.
        SELECT id INTO v_user_id
        FROM comment_users
        WHERE provider = 'facebook'
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