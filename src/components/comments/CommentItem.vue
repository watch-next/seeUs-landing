<template>
  <article
    :data-comment-id="comment.id"
    class="comment-item"
    :class="{
      'comment-item--deleted': isDeleted,
      'comment-item--unowned': !isOwned,
    }"
  >
    <div class="comment-item__avatar">
      <img :src="avatarUrl" :alt="authorName" width="40" height="40" loading="lazy" />
    </div>

    <div class="comment-item__body">
      <header class="comment-item__header">
        <span class="comment-item__name">{{ authorName }}</span>
        <span class="comment-item__time">{{ formattedDate }}</span>
        <span v-if="comment.edited" class="comment-item__edited">(edited)</span>
      </header>

      <div class="comment-item__content">
        <!-- eslint-disable-next-line vue/no-v-html -->
        <p v-if="isDeleted" class="comment-item__deleted-text"><em>[This comment was deleted]</em></p>
        <!-- eslint-disable-next-line vue/no-v-html -->
        <p v-else v-html="renderedContent"></p>
      </div>

      <CommentActions
        v-if="!isDeleted"
        :comment="comment"
        :can-reply="true"
        :can-edit="isOwned"
        :can-delete="isOwned"
        :disabled="submitting"
        @reply="toggleReply"
        @like="$emit('toggleLike', { commentId: comment.id })"
        @edit="toggleEdit"
        @delete="$emit('delete', { commentId: comment.id })"
        @report="$emit('report', { commentId: comment.id })"
      />

      <CommentComposer
        v-if="showEdit && !isDeleted"
        :post-slug="postSlug"
        :display-name="displayName"
        :initial-value="comment.content"
        :submit-label="'Save'"
        :can-cancel="true"
        :submitting="submitting"
        @submit="onEditSubmit"
        @cancel="showEdit = false"
      />

      <ReplyComposer
        v-if="showReply && !isDeleted"
        :post-slug="postSlug"
        :reply-to-name="authorName"
        :parent-id="comment.id"
        :display-name="displayName"
        :submitting="submitting"
        @submit="(payload) => $emit('reply', payload)"
        @cancel="showReply = false"
      />

      <!-- Nested replies -->
      <ul v-if="replies && replies.length > 0" class="comment-item__replies">
        <li v-for="reply in replies" :key="reply.id">
          <CommentItem
            :comment="reply"
            :post-slug="postSlug"
            :anonymous-token="anonymousToken"
            :display-name="displayName"
            :submitting="submitting"
            :reply-count="0"
            @edit="(payload) => $emit('edit', payload)"
            @reply="(payload) => $emit('reply', payload)"
            @delete="(payload) => $emit('delete', payload)"
            @toggle-like="(payload) => $emit('toggleLike', payload)"
            @report="(payload) => $emit('report', payload)"
          />
        </li>
      </ul>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Comment, CommentMentionDraft } from '@/types/comments'
import { renderCommentContent } from '@/services/comments/render'
import CommentActions from './CommentActions.vue'
import CommentComposer from './CommentComposer.vue'
import ReplyComposer from './ReplyComposer.vue'

const props = withDefaults(
  defineProps<{
    comment: Comment
    postSlug: string
    anonymousToken: string | null
    displayName?: string
    submitting?: boolean
    replyCount?: number
  }>(),
  {
    displayName: '',
    submitting: false,
    replyCount: 0,
  },
)

const emit = defineEmits<{
  edit: [payload: { commentId: string; content: string; mentions: CommentMentionDraft[] }]
  reply: [payload: { parentId: string; content: string; mentions: CommentMentionDraft[] }]
  delete: [payload: { commentId: string }]
  toggleLike: [payload: { commentId: string }]
  report: [payload: { commentId: string }]
}>()

const showReply = ref(false)
const showEdit = ref(false)

const author = computed(() => props.comment.author)
const isDeleted = computed(() => props.comment.deletedAt !== null)
const replies = computed(() => props.comment.replies ?? [])

const isOwned = computed(() => {
  if (isDeleted.value) return false
  if (!props.anonymousToken || !author.value) return false
  return author.value.provider === 'anonymous' && author.value.anonymousToken === props.anonymousToken
})

const renderedContent = computed(() => {
  if (isDeleted.value) return ''
  return renderCommentContent(props.comment.content, props.comment.mentions ?? [])
})

const authorName = computed(() => author.value?.displayName ?? 'Anonymous')
const DICEBEAR_BASE = 'https://api.dicebear.com/9.x/bottts-neutral/svg'

const avatarUrl = computed(() => {
  if (author.value?.avatarUrl) return author.value.avatarUrl
  const seed = encodeURIComponent(author.value?.avatarSeed ?? 'anon')
  return `${DICEBEAR_BASE}?seed=${seed}`
})

const formattedDate = computed(() => {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(props.comment.createdAt))
  } catch {
    return props.comment.createdAt
  }
})

function toggleReply() {
  showReply.value = !showReply.value
}

function toggleEdit() {
  showEdit.value = !showEdit.value
}

function onEditSubmit(payload: { content: string; mentions: CommentMentionDraft[] }) {
  emit('edit', { commentId: props.comment.id, ...payload })
  showEdit.value = false
}

</script>

<style lang="scss" scoped>
@use '@/style/variables' as *;

.comment-item {
  display: flex;
  gap: $space-3;
  padding: $space-4 0;

  & + & {
    border-top: 1px solid $color-border;
  }

  &--deleted {
    opacity: 0.5;
  }

  &__avatar {
    flex-shrink: 0;

    img {
      border-radius: $radius-full;
    }
  }

  &__body {
    flex: 1;
    min-width: 0;
  }

  &__header {
    display: flex;
    align-items: center;
    gap: $space-2;
    margin-bottom: $space-1;
    flex-wrap: wrap;
  }

  &__name {
    font-weight: 600;
    color: $color-text;
    font-size: $text-sm;
  }

  &__time {
    color: $color-text-muted;
    font-size: $text-xs;
  }

  &__edited {
    color: $color-text-muted;
    font-size: $text-xs;
    font-style: italic;
  }

  &__content {
    color: $color-text;
    font-size: $text-sm;
    line-height: 1.6;
    word-break: break-word;
  }

  &__deleted-text {
    color: $color-text-muted;
    font-style: italic;
  }

  &__replies {
    list-style: none;
    padding: 0;
    margin: $space-3 0 0 0;
    border-left: 2px solid $color-border;
    padding-left: $space-4;
  }
}
</style>
