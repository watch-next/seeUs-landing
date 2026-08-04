// Mention autocomplete — scoped to users who already commented on the same
// article. We do NOT expose the global commenter list.
//
// Calls the SECURITY INVOKER (read-only) `search_commenters` RPC defined in
// supabase/migrations/20260803120000_create_comments.sql.

import { supabase } from '@/lib/supabase'
import type { CommenterSearchRow } from '@/types/comments'

export async function searchCommenters(
  postSlug: string,
  query: string,
): Promise<CommenterSearchRow[]> {
  const trimmed = query.trim()
  if (trimmed.length === 0) return []

  const { data, error } = await supabase.rpc('search_commenters', {
    p_post_slug: postSlug,
    p_query: trimmed,
  })
  if (error) throw error
  return (data ?? []) as CommenterSearchRow[]
}
