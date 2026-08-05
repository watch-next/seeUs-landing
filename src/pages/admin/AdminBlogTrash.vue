<template>
  <AdminLayout>
    <div class="admin-blog-trash">
      <header class="admin-blog-trash__header">
        <h1>Trash</h1>
        <p class="admin-blog-trash__subtitle">
          Deleted posts will appear here. You can restore or permanently remove them.
        </p>
      </header>

      <div v-if="isLoading" class="admin-blog-trash__state">
        <p>Loading deleted posts…</p>
      </div>

      <div v-else-if="error" class="admin-blog-trash__state admin-blog-trash__state--error">
        <p>{{ error }}</p>
        <button class="admin-blog-trash__btn" @click="loadPosts">Retry</button>
      </div>

      <div v-else-if="posts.length === 0" class="admin-blog-trash__empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="48" height="48">
          <polyline points="3,6 5,6 21,6" stroke-width="2" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke-width="2" />
        </svg>
        <p>No deleted posts.</p>
      </div>

      <ul v-else class="admin-blog-trash__list">
        <li
          v-for="post in posts"
          :key="post.id"
          class="admin-blog-trash__item"
        >
          <div class="admin-blog-trash__item-info">
            <h3>{{ post.title }}</h3>
            <p class="admin-blog-trash__item-meta">
              <span>Slug: {{ post.slug }}</span>
              <span v-if="post.deletedAt">
                Deleted: {{ formatDate(post.deletedAt) }}
              </span>
            </p>
          </div>

          <div class="admin-blog-trash__item-actions">
            <button
              class="admin-blog-trash__btn"
              :disabled="actionInProgress === post.id"
              @click="onRestore(post.id)"
            >
              Restore
            </button>
            <button
              class="admin-blog-trash__btn admin-blog-trash__btn--danger"
              :disabled="actionInProgress === post.id"
              @click="onPermanentDelete(post.id)"
            >
              Delete permanently
            </button>
          </div>
        </li>
      </ul>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import AdminLayout from '@/components/admin/AdminLayout.vue'
import {
  getAdminBlogPosts,
  restoreBlogPost,
  permanentlyDeleteBlogPost,
} from '@/services/blogAdminService'
import type { BlogPostRecord } from '@/services/blogAdminService'

const posts = ref<BlogPostRecord[]>([])
const isLoading = ref(true)
const error = ref<string | null>(null)
const actionInProgress = ref<string | null>(null)

const formatDate = (iso: string): string => {
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

const loadPosts = async () => {
  isLoading.value = true
  error.value = null

  const { data, error: err } = await getAdminBlogPosts({
    deletedOnly: true,
  })

  if (err) {
    error.value = err
  } else {
    posts.value = data
  }

  isLoading.value = false
}

const onRestore = async (id: string) => {
  actionInProgress.value = id
  const { error: err } = await restoreBlogPost(id)
  actionInProgress.value = null

  if (err) {
    error.value = err
    return
  }

  posts.value = posts.value.filter((p) => p.id !== id)
}

const onPermanentDelete = async (id: string) => {
  if (!confirm('Permanently delete this post? This cannot be undone.')) {
    return
  }

  actionInProgress.value = id
  const { error: err } = await permanentlyDeleteBlogPost(id)
  actionInProgress.value = null

  if (err) {
    error.value = err
    return
  }

  posts.value = posts.value.filter((p) => p.id !== id)
}

onMounted(loadPosts)
</script>

<style scoped>
.admin-blog-trash {
  padding: 2rem;
}

.admin-blog-trash__header {
  margin-bottom: 2rem;
}

.admin-blog-trash__header h1 {
  margin: 0 0 0.5rem 0;
  font-size: 1.75rem;
}

.admin-blog-trash__subtitle {
  margin: 0;
  color: var(--text-muted, #6b7280);
}

.admin-blog-trash__state,
.admin-blog-trash__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 4rem 2rem;
  color: var(--text-muted, #6b7280);
  text-align: center;
  border: 1px dashed var(--border-color, #e5e7eb);
  border-radius: 8px;
}

.admin-blog-trash__state--error {
  color: #b91c1c;
  border-color: #fecaca;
}

.admin-blog-trash__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.admin-blog-trash__item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 8px;
}

.admin-blog-trash__item-info h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
}

.admin-blog-trash__item-meta {
  margin: 0;
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  font-size: 0.8125rem;
  color: var(--text-muted, #6b7280);
}

.admin-blog-trash__item-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.admin-blog-trash__btn {
  padding: 0.4rem 0.85rem;
  font-size: 0.8125rem;
  border: 1px solid var(--border-color, #d1d5db);
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
}

.admin-blog-trash__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.admin-blog-trash__btn--danger {
  color: #b91c1c;
  border-color: #fecaca;
}

.admin-blog-trash__btn--danger:hover:not(:disabled) {
  background: #fef2f2;
}
</style>
