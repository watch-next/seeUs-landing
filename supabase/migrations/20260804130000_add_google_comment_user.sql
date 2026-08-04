-- Google comment identity support
-- Adds the RPC used by the frontend to upsert the Google commenter profile.

CREATE OR REPLACE FUNCTION upsert_comment_user_google(
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
        RAISE EXCEPTION 'Google session required';
    END IF;

    SELECT *
    INTO v_user
    FROM comment_users
    WHERE provider = 'google'
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
