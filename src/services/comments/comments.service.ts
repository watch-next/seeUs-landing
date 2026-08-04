// Comments service — thin wrappers around Supabase RPC functions.
// All mutations are ownership-checked server-side; see migration
// 20260803120000_create_comments.sql. Likes + reports live in
// migration 20260803130000_create_comment_likes_and_reports.sql.

import { supabase } from '@/lib/supabase'
import type {
  Comment,
  CommentListRow,
  CommentMention,
  CommentMentionDraft,
  CommentsPage,
  CreateCommentInput,
  ListCommentsParams,
  ReportCategory,
  UpdateCommentInput,
} from '@/types/comments'

const DEFAULT_LIMIT = 20

/** Row shape returned by list_replies RPC (no comment_count column). */
interface CommentReplyListRow {
  comment_id: string
  post_slug: string
  parent_id: string | null
  user_id: string
  content: string
  created_at: string
  updated_at: string
  deleted_at: string | null
  edited: boolean
  comments_user_provider: Comment['author']['provider']
  comments_user_anonymous_token: string | null
  comments_user_display_name: string
  comments_user_avatar_seed: string
  comments_user_avatar_url: string | null
  like_count: number
  has_liked: boolean
}

function mentionsToDrafts(mentions?: CommentMentionDraft[]): CommentMentionDraft[] {
  return mentions ?? []
}

function rowToMention(row: {
  id: string
  comment_id: string
  mentioned_user_id: string | null
  mentioned_display_name: string
  start_index: number
  end_index: number
}): CommentMention {
  return {
    id: row.id,
    commentId: row.comment_id,
    mentionedUserId: row.mentioned_user_id,
    mentionedDisplayName: row.mentioned_display_name,
    startIndex: row.start_index,
    endIndex: row.end_index,
  }
}

/** Hydrate mention rows for a comment by querying the join table. */
async function hydrateMentions(commentId: string): Promise<CommentMention[]> {
  const { data, error } = await supabase
    .from('comment_mentions')
    .select('id, comment_id, mentioned_user_id, mentioned_display_name, start_index, end_index')
    .eq('comment_id', commentId)
    .order('start_index', { ascending: true })

  if (error) {
    console.error('[comments.service] hydrateMentions failed', error)
    return []
  }

  return ((data ?? []) as Parameters<typeof rowToMention>[0][]).map(rowToMention)
}

/** Hydrate all mentions for a batch of comment ids in one round-trip. */
async function hydrateMentionsBatch(commentIds: string[]): Promise<Map<string, CommentMention[]>> {
  const result = new Map<string, CommentMention[]>()
  if (commentIds.length === 0) return result

  const { data, error } = await supabase
    .from('comment_mentions')
    .select('id, comment_id, mentioned_user_id, mentioned_display_name, start_index, end_index')
    .in('comment_id', commentIds)
    .order('start_index', { ascending: true })

  if (error) {
    console.error('[comments.service] hydrateMentionsBatch failed', error)
    return result
  }

  for (const row of (data ?? []) as Parameters<typeof rowToMention>[0][]) {
    const list = result.get(row.comment_id) ?? []
    list.push(rowToMention(row))
    result.set(row.comment_id, list)
  }
  return result
}

function rowToComment(
  row: CommentListRow,
  mentions: CommentMention[],
  replyCount = 0,
): Comment {
  return {
    id: row.comment_id,
    postSlug: row.post_slug,
    parentId: row.parent_id,
    userId: row.user_id,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    edited: row.edited,
    author: {
      provider: row.comments_user_provider,
      anonymousToken: row.comments_user_anonymous_token,
      displayName: row.comments_user_display_name,
      avatarSeed: row.comments_user_avatar_seed,
      avatarUrl: row.comments_user_avatar_url,
    },
    mentions,
    replyCount,
    likeCount: row.like_count ?? 0,
    hasLiked: row.has_liked ?? false,
  }
}

export async function listComments({
  slug,
  cursor = null,
  limit = DEFAULT_LIMIT,
  anonymousToken = null,
}: ListCommentsParams): Promise<CommentsPage> {
  const rpcArgs: Record<string, unknown> = {
    p_post_slug: slug,
    p_limit: limit,
    p_anonymous_token: anonymousToken,
  }

  if (cursor !== null) {
    rpcArgs.p_cursor = cursor
  }

  const { data, error } = await supabase.rpc('list_comments', rpcArgs)

  if (error) {
    console.error('[comments.service] list_comments failed', error)
    throw error
  }

  const rows = (data as CommentListRow[]) ?? []
  if (rows.length === 0) {
    return { comments: [], totalCount: 0, nextCursor: null, hasMore: false }
  }

  const totalCount = Number(rows[0].comment_count ?? rows.length)

  const commentIds = rows.map((row) => row.comment_id)
  const mentionsMap = await hydrateMentionsBatch(commentIds)

  const mapped = rows.map((row) =>
    rowToComment(row, mentionsMap.get(row.comment_id) ?? [], 0),
  )
  const byId = new Map(mapped.map((comment) => [comment.id, comment]))
  const comments: Comment[] = []

  for (const comment of mapped) {
    if (comment.parentId) {
      const parent = byId.get(comment.parentId)
      if (parent) {
        parent.replies = [...(parent.replies ?? []), comment]
        parent.replyCount = parent.replies.length
        continue
      }
    }
    comments.push(comment)
  }

  const lastRow = rows[rows.length - 1]
  const nextCursor = lastRow.created_at
  const hasMore = comments.length < totalCount && rows.length === limit

  return {
    comments,
    totalCount,
    nextCursor,
    hasMore,
  }
}

export async function createComment(input: CreateCommentInput): Promise<Comment> {
  const { data, error } = await supabase.rpc('create_comment', {
    p_post_slug: input.postSlug,
    p_parent_id: input.parentId,
    p_content: input.content,
    p_anonymous_token: input.anonymousToken,
    p_display_name: input.displayName,
    p_avatar_seed: input.avatarSeed,
    // p_mentions is declared jsonb in the migration. The Supabase JS client
    // serializes a JS array to a proper jsonb array. Passing JSON.stringify
    // here would encode it as a scalar jsonb string, and jsonb_array_elements
    // would raise SQLSTATE 22023 "cannot extract elements from a scalar".
    p_mentions: mentionsToDrafts(input.mentions),
  })

  if (error) {
    console.error('[comments.service] create_comment failed', error)
    throw error
  }

  const created = data as Comment & { created_at: string }
  const createdId = (created as unknown as { id: string }).id
  if (!createdId) {
    throw new Error('create_comment returned no row')
  }

  const mentions = await hydrateMentions(createdId)
  const replyCount = 0

  return {
    id: createdId,
    postSlug: input.postSlug,
    parentId: input.parentId,
    userId: (created as unknown as { user_id: string }).user_id,
    content: (created as unknown as { content: string }).content ?? input.content,
    createdAt: (created as unknown as { created_at: string }).created_at,
    updatedAt: (created as unknown as { updated_at: string }).updated_at,
    deletedAt: null,
    edited: false,
    author: {
      provider: 'anonymous',
      anonymousToken: input.anonymousToken,
      displayName: input.displayName,
      avatarSeed: input.avatarSeed,
      avatarUrl: null,
    },
    mentions,
    replyCount,
    likeCount: 0,
    hasLiked: false,
  }
}

export async function updateComment(input: UpdateCommentInput): Promise<Comment> {
  const { data, error } = await supabase.rpc('update_comment', {
    p_comment_id: input.commentId,
    p_content: input.content,
    p_anonymous_token: input.anonymousToken,
    p_mentions: mentionsToDrafts(input.mentions),
  })

  if (error) {
    console.error('[comments.service] update_comment failed', error)
    throw error
  }

  const updatedId = (data as unknown as { id: string }).id
  const mentions = await hydrateMentions(updatedId)

  return {
    id: updatedId,
    postSlug: (data as unknown as { post_slug: string }).post_slug,
    parentId: (data as unknown as { parent_id: string | null }).parent_id,
    userId: (data as unknown as { user_id: string }).user_id,
    content: (data as unknown as { content: string }).content,
    createdAt: (data as unknown as { created_at: string }).created_at,
    updatedAt: (data as unknown as { updated_at: string }).updated_at,
    deletedAt: null,
    edited: true,
    author: {
      provider: 'anonymous',
      anonymousToken: null,
      displayName: '',
      avatarSeed: '',
      avatarUrl: null,
    },
    mentions,
    replyCount: 0,
    likeCount: 0,
    hasLiked: false,
  }
}

export async function deleteComment(commentId: string, anonymousToken: string): Promise<void> {
  const { error } = await supabase.rpc('delete_comment', {
    p_comment_id: commentId,
    p_anonymous_token: anonymousToken,
  })

  if (error) {
    console.error('[comments.service] delete_comment failed', error)
    throw error
  }
}

/**
 * Fetch replies for a single top-level comment via the list_replies RPC.
 * The RPC joins author fields and returns like_count + has_liked, so no
 * second author-hydration round trip is needed. Mentions are still
 * batch-hydrated client-side (the RPC does not return them).
 */
export async function listReplies(
  parentId: string,
  anonymousToken: string | null = null,
  limit = 50,
): Promise<Comment[]> {
  const { data, error } = await supabase.rpc('list_replies', {
    p_parent_id: parentId,
    p_anonymous_token: anonymousToken,
  })

  if (error) {
    console.error('[comments.service] listReplies failed', error)
    return []
  }

  const rows = (data ?? []) as unknown as CommentReplyListRow[]
  if (rows.length === 0) return []

  const mentionsMap = await hydrateMentionsBatch(rows.map((r) => r.comment_id))

  return rows.map((row) => ({
    id: row.comment_id,
    postSlug: row.post_slug,
    parentId: row.parent_id,
    userId: row.user_id,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    edited: row.edited,
    author: {
      provider: row.comments_user_provider,
      anonymousToken: row.comments_user_anonymous_token,
      displayName: row.comments_user_display_name,
      avatarSeed: row.comments_user_avatar_seed,
      avatarUrl: row.comments_user_avatar_url,
    },
    mentions: mentionsMap.get(row.comment_id) ?? [],
    replyCount: 0,
    likeCount: row.like_count ?? 0,
    hasLiked: row.has_liked ?? false,
  })).slice(0, limit)
}

/**
 * Toggle a like on a comment. Returns the new { liked, likeCount } from the
 * server. Caller updates local state optimistically and rolls back on error.
 */
export async function toggleLike(
  commentId: string,
  anonymousToken: string,
): Promise<{ liked: boolean; likeCount: number }> {
  const { data, error } = await supabase.rpc('toggle_comment_like', {
    p_comment_id: commentId,
    p_anonymous_token: anonymousToken,
  })

  if (error) {
    console.error('[comments.service] toggleLike failed', error)
    throw error
  }

  const result = (data ?? []) as unknown as Array<{ liked: boolean; like_count: number }>
  if (result.length === 0) {
    throw new Error('toggle_comment_like returned no rows')
  }
  return { liked: result[0].liked, likeCount: result[0].like_count }
}

/**
 * File a report. Returns true if a new report was created, false if this
 * reporter has already reported this comment (idempotent).
 */
export async function reportComment(
  commentId: string,
  anonymousToken: string,
  category: ReportCategory,
  reason?: string,
): Promise<boolean> {
  const { data, error } = await supabase.rpc('report_comment', {
    p_comment_id: commentId,
    p_anonymous_token: anonymousToken,
    p_category: category,
    p_reason: reason ?? null,
  })

  if (error) {
    console.error('[comments.service] reportComment failed', error)
    throw error
  }

  return (data as unknown as boolean) ?? false
}
