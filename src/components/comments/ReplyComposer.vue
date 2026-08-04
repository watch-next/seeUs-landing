<template>
  <div class="reply-composer">
    <div class="reply-composer__banner">
      Replying to <strong>{{ replyToName }}</strong>
    </div>
    <CommentComposer
      ref="composerRef"
      :post-slug="postSlug"
      :display-name="displayName"
      :placeholder="`Reply to ${replyToName}...`"
      :submit-label="'Reply'"
      :can-cancel="true"
      :submitting="submitting"
      @submit="onSubmit"
      @cancel="$emit('cancel')"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { CommentMentionDraft } from '@/types/comments'
import CommentComposer from './CommentComposer.vue'

const props = defineProps<{
  postSlug: string
  replyToName: string
  parentId: string
  displayName?: string
  submitting?: boolean
}>()

const emit = defineEmits<{
  submit: [payload: { parentId: string; content: string; mentions: CommentMentionDraft[] }]
  cancel: []
}>()

const composerRef = ref<InstanceType<typeof CommentComposer> | null>(null)

function onSubmit(payload: { content: string; mentions: CommentMentionDraft[] }) {
  emit('submit', { parentId: props.parentId, ...payload })
  composerRef.value?.reset()
}
</script>

<style lang="scss" scoped>
@use '@/style/variables' as *;

.reply-composer {
  padding: $space-3 0 $space-3 $space-4;
  border-left: 2px solid $color-primary;

  &__banner {
    color: $color-text-muted;
    font-size: $text-sm;
    margin-bottom: $space-2;
  }
}
</style>