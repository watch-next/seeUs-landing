<template>
  <section class="comment-section">
    <header class="comment-section__header">
      <h3 class="comment-section__title">
        Comments
        <span v-if="totalCount > 0" class="comment-section__count">{{ totalCount }}</span>
      </h3>
      <CommentAuthSelector
        :active-provider="activeProvider"
        :busy-provider="authenticating ? pendingProvider : null"
        @select="onSelectProvider"
      />
      <button
        v-if="activeProvider === 'google' || activeProvider === 'facebook'"
        type="button"
        class="btn btn-ghost btn-sm comment-section__logout"
        :disabled="authenticating"
        @click="onLogout"
      >
        Logout
      </button>
    </header>

    <p v-if="authenticating" class="comment-section__status">Connecting...</p>
    <p v-else-if="error" class="comment-section__status comment-section__status--error">
      {{ error }}
    </p>

    <!-- Skeleton loading state -->
    <template v-if="loading">
      <CommentSkeleton v-for="i in 3" :key="i" />
    </template>

    <template v-else>
      <CommentComposer
        ref="composerRef"
        :post-slug="postSlug"
        :display-name="profile.displayName"
        :submitting="submitting"
        @submit="onSubmit"
      />

      <CommentList
        :comments="comments"
        :post-slug="postSlug"
        :auth="profile"
        :submitting="submitting"
        :loading="loading"
        :has-more="hasMore"
        @load-more="loadMore()"
        @edit="onEdit"
        @reply="onReply"
        @delete="onDelete"
        @toggle-like="onToggleLike"
        @report="onReportClick"
      />

      <!-- Delete confirmation dialog -->
      <BottomDialog
        v-model="showDeleteConfirm"
        title="Delete comment?"
        :described-by="deleteDialogDescriptionId"
        @close="showDeleteConfirm = false"
      >
        <p :id="deleteDialogDescriptionId" class="dialog-body">
          This action cannot be undone.
          <br />
          Are you sure you want to delete this comment?
        </p>
        <div class="dialog-actions">
          <button
            type="button"
            class="btn btn-ghost btn-sm"
            :disabled="deleting"
            @click="showDeleteConfirm = false"
          >
            Cancel
          </button>
          <button
            type="button"
            class="btn btn-error btn-sm"
            :disabled="deleting"
            @click="confirmDelete"
          >
            {{ deleting ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </BottomDialog>

      <!-- Report dialog -->
      <CommentReport
        v-model="showReportModal"
        :comment-id="reportCommentId"
        :submitting="reportSubmitting"
        :success="reportSuccess"
        @report="onReport"
      />
    </template>
  </section>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import type { CommentMentionDraft, ReportCategory } from '@/types/comments'
import { useComments } from '@/composables/useComments'
import CommentComposer from './CommentComposer.vue'
import CommentList from './CommentList.vue'
import CommentSkeleton from './CommentSkeleton.vue'
import CommentReport from './CommentReport.vue'
import CommentAuthSelector from './CommentAuthSelector.vue'
import BottomDialog from '@/components/BottomDialog.vue'

const props = defineProps<{
  postSlug: string
}>()

const {
  comments,
  loading,
  submitting,
  error,
  hasMore,
  totalCount,
  profile,
  activeProvider,
  pendingProvider,
  authenticating,
  load,
  loadMore,
  addComment,
  replyTo,
  editComment,
  removeComment,
  likeComment,
  reportComment,
  selectProvider,
  logout,
} = useComments(props.postSlug)

const composerRef = ref<InstanceType<typeof CommentComposer> | null>(null)
const showReportModal = ref(false)
const reportCommentId = ref('')
const showDeleteConfirm = ref(false)
const deleting = ref(false)
const pendingDeleteId = ref<string | null>(null)
const deleteDialogDescriptionId = 'delete-comment-dialog-description'
const newCommentId = ref<string | null>(null)
const reportSubmitting = ref(false)
const reportSuccess = ref(false)

// initial load
load()

async function onSubmit(payload: { content: string; mentions: CommentMentionDraft[] }) {
  const created = await addComment(payload.content, payload.mentions)
  if (created) {
    newCommentId.value = created.id
    composerRef.value?.reset()
    await nextTick()
    scrollToComment(created.id)
  }
}

async function onReply(payload: { parentId: string; content: string; mentions: CommentMentionDraft[] }) {
  const created = await replyTo(payload.parentId, payload.content, payload.mentions)
  if (created) {
    newCommentId.value = created.id
  }
}

async function onEdit(payload: { commentId: string; content: string; mentions: CommentMentionDraft[] }) {
  await editComment(payload.commentId, payload.content, payload.mentions)
}

function onDelete(payload: { commentId: string }) {
  pendingDeleteId.value = payload.commentId
  showDeleteConfirm.value = true
}

async function confirmDelete() {
  if (!pendingDeleteId.value) return
  deleting.value = true
  await removeComment(pendingDeleteId.value)
  deleting.value = false
  if (!error.value) {
    showDeleteConfirm.value = false
    pendingDeleteId.value = null
  }
}

async function onToggleLike(payload: { commentId: string }) {
  await likeComment(payload.commentId)
}

function onReportClick(payload: { commentId: string }) {
  reportSubmitting.value = false
  reportSuccess.value = false
  reportCommentId.value = payload.commentId
  showReportModal.value = true
}

async function onReport(payload: { commentId: string; category: ReportCategory }) {
  reportSubmitting.value = true
  reportSuccess.value = false
  await reportComment(payload.commentId, payload.category)
  reportSubmitting.value = false
  reportSuccess.value = true
  setTimeout(() => {
    showReportModal.value = false
  }, 1500)
}

function scrollToComment(commentId: string) {
  const el = document.querySelector(`[data-comment-id="${commentId}"]`)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

async function onSelectProvider(payload: { provider: 'anonymous' | 'google' | 'facebook' | 'github'; ready: boolean }) {
  if (!payload.ready) return
  if (payload.provider === activeProvider.value) return
  await selectProvider(payload.provider)
}

async function onLogout() {
  await logout()
}
</script>

<style lang="scss" scoped>
@use '@/style/variables' as *;

.comment-section {
  padding: $space-8 0;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: $space-4;
  }

  &__logout {
    margin-left: $space-3;
  }

  &__status {
    margin: 0 0 $space-4;
    color: $color-text-muted;
    font-size: $text-sm;

    &--error {
      color: $color-error;
    }
  }

  &__title {
    font-size: $text-lg;
    color: $color-text;
    display: flex;
    align-items: center;
    gap: $space-2;
  }

  &__count {
    background: $color-primary;
    color: white;
    font-size: $text-xs;
    padding: 2px 8px;
    border-radius: $radius-full;
    font-weight: 600;
  }
}

.dialog-body {
  color: $color-text;
  font-size: $text-sm;
  line-height: 1.6;
  margin: 0;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: $space-3;
  margin-top: $space-6;
}
</style>
