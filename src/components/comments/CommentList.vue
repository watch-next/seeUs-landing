<template>
  <div class="comment-list">
    <ul class="comment-list__items" v-if="comments.length > 0">
      <li v-for="comment in comments" :key="comment.id">
        <CommentItem
          :comment="comment"
          :post-slug="postSlug"
          :auth="auth"
          :submitting="submitting"
          @edit="(payload) => $emit('edit', payload)"
          @reply="(payload) => $emit('reply', payload)"
          @delete="(payload) => $emit('delete', payload)"
          @toggle-like="(payload) => $emit('toggleLike', payload)"
          @report="(payload) => $emit('report', payload)"
        />
      </li>
    </ul>

    <p v-else-if="!loading" class="comment-list__empty">No comments yet. Be the first to comment!</p>

    <button
      v-if="hasMore"
      class="btn btn-ghost btn-sm comment-list__more"
      :disabled="loading"
      @click="$emit('loadMore')"
    >
      {{ loading ? 'Loading...' : 'Load more comments' }}
    </button>
  </div>
</template>

<script setup lang="ts">
import type { Comment, CommentMentionDraft } from '@/types/comments'
import type { CommentAuthProfile } from '@/types/comments'
import CommentItem from './CommentItem.vue'

defineProps<{
  comments: Comment[]
  postSlug: string
  auth: CommentAuthProfile
  submitting?: boolean
  loading?: boolean
  hasMore?: boolean
}>()

defineEmits<{
  loadMore: []
  edit: [payload: { commentId: string; content: string; mentions: CommentMentionDraft[] }]
  reply: [payload: { parentId: string; content: string; mentions: CommentMentionDraft[] }]
  delete: [payload: { commentId: string }]
  toggleLike: [payload: { commentId: string }]
  report: [payload: { commentId: string }]
}>()
</script>

<style lang="scss" scoped>
@use '@/style/variables' as *;

.comment-list {
  &__items {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  &__empty {
    color: $color-text-muted;
    text-align: center;
    padding: $space-8 0;
    font-size: $text-sm;
  }

  &__more {
    width: 100%;
    margin-top: $space-4;
  }
}
</style>
