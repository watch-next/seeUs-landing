export async function createComment(input: CreateCommentInput): Promise<Comment> {
  const { data, error } = await commentsSupabase.rpc('create_comment', {
    p_post_slug: input.postSlug,
    p_parent_id: input.parentId,
    p_content: input.content,
    p_display_name: input.auth.displayName,
    p_avatar_seed: input.auth.avatarSeed,
    ...buildRpcAuthArgs(input.auth),
    // p_mentions is declared jsonb in the migration. The Supabase JS client
    // serializes a JS array to a proper jsonb array. Passing JSON.stringify
    // here would encode it as a scalar jsonb string, and jsonb_array_elements
    // would raise SQLSTATE 22023 "cannot extract elements from a scalar".
    p_mentions: mentionsToDrafts(input.mentions),
    // Support content_type and content_id for Movies/TV Shows
    // Fall back to using post_slug as content_id for blog_post for backward compatibility
    p_content_type: input.contentType ?? 'blog_post',
    p_content_id: input.contentId ?? input.postSlug,
  })

  if (error) throw error
  return data
}