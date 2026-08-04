<template>
  <div class="comment-actions">
    <button
      v-if="canReply"
      class="btn-ghost btn-sm"
      @click="$emit('reply')"
    >
      Reply
    </button>

    <CommentLike
      :comment="comment"
      :disabled="disabled"
      @toggle="$emit('like')"
    />

    <button
      v-if="canEdit"
      class="btn-ghost btn-sm"
      @click="$emit('edit')"
    >
      Edit
    </button>

    <button
      v-if="canDelete"
      class="btn-ghost btn-sm comment-actions__delete"
      @click="$emit('delete')"
    >
      Delete
    </button>

    <button
      class="btn-ghost btn-sm comment-actions__report"
      @click="$emit('report')"
    >
      Report
    </button>
  </div>
</template>

<script setup lang="ts">
import type { Comment } from '@/types/comments'
import CommentLike from './CommentLike.vue'

defineProps<{
  comment: Comment
  canReply?: boolean
  canEdit?: boolean
  canDelete?: boolean
  disabled?: boolean
}>()

defineEmits<{
  reply: []
  like: []
  edit: []
  delete: []
  report: []
}>()
</script>

<style lang="scss" scoped>
.comment-actions {
  display: flex;
  align-items: center;
  gap: $space-1;

  &__delete {
    color: $color-error;

    &:hover {
      color: $color-error;
      opacity: 0.8;
    }
  }

  &__report {
    color: $color-text-muted;
  }
}
</style>