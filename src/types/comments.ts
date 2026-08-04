// Blog comments type definitions
// Isolated from admin auth types. See plan: keen-mixing-shore.md

export type CommentProvider = 'anonymous' | 'facebook' | 'google' | 'github'

export interface CommentUser {
  id: string
  provider: CommentProvider
  providerUserId: string | null
  anonymousToken: string | null
  displayName: string
  avatarSeed: string
  avatarUrl: string | null
  email: string | null
  createdAt: string
  updatedAt: string
}

export interface CommentMention {
  id: string
  commentId: string
  mentionedUserId: string | null
  mentionedDisplayName: string
  startIndex: number
  endIndex: number
}

export interface Comment {
  id: string
  postSlug: string
  parentId: string | null
  userId: string
  content: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  edited: boolean
  /** Denormalized author profile joined from comment_users. */
  author: {
    provider: CommentProvider
    anonymousToken: string | null
    displayName: string
    avatarSeed: string
    avatarUrl: string | null
  }
  mentions: CommentMention[]
  replies?: Comment[]
  /** Count of replies belonging to this comment (top-level only). */
  replyCount?: number
  /** Number of likes on this comment (denormalized at read time). */
  likeCount: number
  /** Whether the current viewer (by anonymousToken) has liked this comment. */
  hasLiked: boolean
}

/** Row shape returned by list_comments RPC. */
export interface CommentListRow {
  comment_id: string
  post_slug: string
  parent_id: string | null
  user_id: string
  content: string
  created_at: string
  updated_at: string
  deleted_at: string | null
  edited: boolean
  comments_user_provider: CommentProvider
  comments_user_anonymous_token: string | null
  comments_user_display_name: string
  comments_user_avatar_seed: string
  comments_user_avatar_url: string | null
  comment_count: number
  like_count: number
  has_liked: boolean
}

/** Row shape returned by search_commenters RPC. */
export interface CommenterSearchRow {
  user_id: string
  display_name: string
  avatar_seed: string
}

export interface CommentsPage {
  comments: Comment[]
  /** Total number of top-level + reply comments for this slug (from COUNT(*) OVER ()). */
  totalCount: number
  /** created_at of the last comment in this page — use as next cursor. */
  nextCursor: string | null
  hasMore: boolean
}

export interface ListCommentsParams {
  slug: string
  cursor?: string | null
  limit?: number
  /** Anonymous token used to resolve has_liked server-side. */
  anonymousToken?: string | null
}

export interface CreateCommentInput {
  postSlug: string
  parentId: string | null
  content: string
  anonymousToken: string
  displayName: string
  avatarSeed: string
  mentions?: CommentMentionDraft[]
}

export interface UpdateCommentInput {
  commentId: string
  content: string
  anonymousToken: string
  mentions?: CommentMentionDraft[]
}

export interface CommentMentionDraft {
  mentionedUserId: string | null
  mentionedDisplayName: string
  startIndex: number
  endIndex: number
}

export type ReportCategory = 'spam' | 'harassment' | 'offensive_language' | 'other'

export interface ReportCommentInput {
  commentId: string
  anonymousToken: string
  category: ReportCategory
  reason?: string
}
