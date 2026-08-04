// useComments — reactive wrapper around comments.service for a single post.
//
// Lifecycle:
//   const { comments, loading, error, hasMore, loadMore, addComment,
//          replyTo, editComment, removeComment, profile } = useComments(slug)

import { ref, computed, readonly, type Ref } from 'vue'
import type {
  Comment,
  CommentMentionDraft,
  CommentsPage,
  ReportCategory,
} from '@/types/comments'
import {
  createComment,
  deleteComment,
  listComments,
  updateComment,
  toggleLike,
  reportComment as reportCommentService,
} from '@/services/comments/comments.service'
import { getAnonymousProfile, persistDisplayName } from '@/services/comments/auth.service'

const PAGE_SIZE = 20

export function useComments(slug: Ref<string> | string) {
  const slugRef = computed(() => (typeof slug === 'string' ? slug : slug.value))

  const comments = ref<Comment[]>([])
  const loading = ref(false)
  const submitting = ref(false)
  const error = ref<string | null>(null)
  const totalCount = ref(0)
  const nextCursor = ref<string | null>(null)
  const hasMore = ref(false)
  const profile = ref(getAnonymousProfile())

  async function load(initial = false): Promise<void> {
    if (initial) {
      nextCursor.value = null
      comments.value = []
    }
    loading.value = true
    error.value = null
    try {
      const page: CommentsPage = await listComments({
        slug: slugRef.value,
        cursor: nextCursor.value,
        limit: PAGE_SIZE,
        anonymousToken: profile.value.anonymousToken,
      })
      if (initial) {
        comments.value = page.comments
      } else {
        comments.value = [...comments.value, ...page.comments]
      }
      totalCount.value = page.totalCount
      nextCursor.value = page.nextCursor
      hasMore.value = page.hasMore

    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load comments'
    } finally {
      loading.value = false
    }
  }

  async function loadMore(): Promise<void> {
    if (!hasMore.value || loading.value) return
    await load(false)
  }

  async function refresh(): Promise<void> {
    await load(true)
  }

  interface SubmitInput {
    content: string
    displayName: string
    parentId?: string | null
    mentions?: CommentMentionDraft[]
  }

  async function submit(input: SubmitInput): Promise<Comment | null> {
    submitting.value = true
    error.value = null
    try {
      // Persist the display name so it survives reloads.
      if (input.displayName && input.displayName !== profile.value.displayName) {
        persistDisplayName(input.displayName)
        profile.value = getAnonymousProfile()
      }

      const created = await createComment({
        postSlug: slugRef.value,
        parentId: input.parentId ?? null,
        content: input.content,
        anonymousToken: profile.value.anonymousToken,
        displayName: input.displayName,
        avatarSeed: profile.value.avatarSeed,
        mentions: input.mentions,
      })

      if (input.parentId) {
        // Insert into the parent's reply list
        const parent = comments.value.find((c) => c.id === input.parentId)
        if (parent) {
          parent.replyCount = (parent.replyCount ?? 0) + 1
          ;(parent as Comment & { replies?: Comment[] }).replies = [
            ...((parent as Comment & { replies?: Comment[] }).replies ?? []),
            created,
          ]
        }
        totalCount.value += 1
      } else {
        comments.value = [created, ...comments.value]
        totalCount.value += 1
      }

      return created
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to submit comment'
      return null
    } finally {
      submitting.value = false
    }
  }

  async function addComment(content: string, displayName: string, mentions?: CommentMentionDraft[]): Promise<Comment | null> {
    return submit({ content, displayName, parentId: null, mentions })
  }

  async function replyTo(parentId: string, content: string, displayName: string, mentions?: CommentMentionDraft[]): Promise<Comment | null> {
    return submit({ content, displayName, parentId, mentions })
  }

  async function editComment(commentId: string, content: string, mentions?: CommentMentionDraft[]): Promise<void> {
    submitting.value = true
    error.value = null
    try {
      const updated = await updateComment({
        commentId,
        content,
        anonymousToken: profile.value.anonymousToken,
        mentions,
      })
      replaceComment(updated)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to edit comment'
    } finally {
      submitting.value = false
    }
  }

  async function removeComment(commentId: string): Promise<void> {
    submitting.value = true
    error.value = null
    try {
      await deleteComment(commentId, profile.value.anonymousToken)
      // Mark deleted locally without losing the row (preserves replies).
      const target = findComment(commentId, comments.value)
      if (target) {
        target.deletedAt = new Date().toISOString()
        target.content = ''
        totalCount.value = Math.max(0, totalCount.value - 1)
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to delete comment'
    } finally {
      submitting.value = false
    }
  }

  /**
   * Merge edit result into the local comment. `update_comment` returns an
   * empty author (display_name / avatar_seed are blank because the RPC does
   * not join comment_users), so we preserve the existing local author and
   * only update the editable fields.
   */
  function replaceComment(updated: Comment): void {
    const target = findComment(updated.id, comments.value)
    if (!target) return
    target.content = updated.content
    target.edited = updated.edited
    target.updatedAt = updated.updatedAt
    target.mentions = updated.mentions
  }

  /** Toggle like with optimistic UI; roll back on RPC error. */
  async function likeComment(commentId: string): Promise<void> {
    const target = findComment(commentId, comments.value)
    if (!target) return
    const prevLiked = target.hasLiked
    const prevCount = target.likeCount
    target.hasLiked = !target.hasLiked
    target.likeCount = Math.max(0, target.likeCount + (target.hasLiked ? 1 : -1))
    try {
      const result = await toggleLike(commentId, profile.value.anonymousToken)
      target.hasLiked = result.liked
      target.likeCount = result.likeCount
    } catch (e) {
      target.hasLiked = prevLiked
      target.likeCount = prevCount
      error.value = e instanceof Error ? e.message : 'Failed to toggle like'
    }
  }

  /** File a report. Returns true if a new report was created (idempotent). */
  async function reportComment(
    commentId: string,
    category: ReportCategory,
    reason?: string,
  ): Promise<boolean> {
    error.value = null
    try {
      return await reportCommentService(
        commentId,
        profile.value.anonymousToken,
        category,
        reason,
      )
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to report comment'
      return false
    }
  }

  function findComment(id: string, list: Comment[]): Comment | null {
    for (const c of list) {
      if (c.id === id) return c
      const replies = (c as Comment & { replies?: Comment[] }).replies ?? []
      const found = findComment(id, replies)
      if (found) return found
    }
    return null
  }

  const topLevelCount = computed(() =>
    comments.value.filter((c) => c.parentId === null).length,
  )

  return {
    comments: readonly(comments),
    loading: readonly(loading),
    submitting: readonly(submitting),
    error: readonly(error),
    hasMore: readonly(hasMore),
    totalCount: readonly(totalCount),
    topLevelCount,
    profile,
    load: refresh,
    loadMore,
    addComment,
    replyTo,
    editComment,
    removeComment,
    likeComment,
    reportComment,
  }
}
