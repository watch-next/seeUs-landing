<template>
  <button
    class="comment-like btn-ghost btn-sm"
    :class="{ 'comment-like--active': comment.hasLiked }"
    :disabled="disabled"
    :aria-label="comment.hasLiked ? 'Unlike this comment' : 'Like this comment'"
    :aria-pressed="comment.hasLiked"
    @click="$emit('toggle')"
  >
    <svg
      class="comment-like__icon"
      :class="{ 'comment-like__icon--filled': comment.hasLiked }"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      :fill="comment.hasLiked ? 'currentColor' : 'none'"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
    </svg>
    <span class="comment-like__count" v-if="comment.likeCount > 0">{{ comment.likeCount }}</span>
  </button>
</template>

<script setup lang="ts">
import type { Comment } from '@/types/comments'

defineProps<{
  comment: Comment
  disabled?: boolean
}>()

defineEmits<{
  toggle: []
}>()
</script>

<style lang="scss" scoped>
@use '@/style/variables' as *;

.comment-like {
  display: inline-flex;
  align-items: center;
  gap: $space-1;
  color: $color-text-muted;
  cursor: pointer;
  transition: color $transition-fast;

  &:hover:not(:disabled) {
    color: $color-primary;
  }

  &--active {
    color: $color-primary;
  }

  &__count {
    font-size: $text-sm;
    font-weight: 500;
  }
}
</style>