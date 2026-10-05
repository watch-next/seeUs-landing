// Mention autocomplete — scoped to users who already commented on the same
// article. We do NOT expose the global commenter list.
//
// Calls the SECURITY INVOKER (read-only) `search_commenters` RPC defined in
// supabase/migrations/20260803120000_create_comments.sql.

import { supabase } from '@/lib/supabase'
import type { CommenterSearchRow } from '@/types/comments'

export async function searchCommenters({
  postSlug,
  contentType,
  contentId,
  query,
}: {
  postSlug?: string
  contentType?: string
  contentId?: string | number
  query: string
}): Promise<CommenterSearchRow[]> {
  const trimmed = query.trim()
  if (trimmed.length === 0) return []

  const rpcArgs: Record<string, unknown> = {
    p_query: trimmed,
  }

  // Handle backward compatibility: if postSlug is provided and contentType/contentId are not, use post_slug
  // Otherwise, use contentType and contentId
  if (postSlug !== undefined && (contentType === undefined || contentId === undefined)) {
    rpcArgs.p_post_slug = postSlug
  } else {
    if (contentType !== undefined) {
      rpcArgs.p_content_type = contentType
    }
    if (contentId !== undefined) {
      rpcArgs.p_content_id = String(contentId)
    }
  }

  const { data, error } = await supabase.rpc('search_commenters', rpcArgs)
  if (error) throw error
  return (data ?? []) as CommenterSearchRow[]
}
