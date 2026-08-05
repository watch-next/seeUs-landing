<template>
  <AdminLayout>
    <div class="admin-blog-settings">
      <header class="admin-blog-settings__header">
        <h1>Settings</h1>
        <p class="admin-blog-settings__subtitle">
          Manage blog configuration and preferences.
        </p>
      </header>

      <section class="admin-blog-settings__section">
        <h2>General</h2>
        <p>Blog settings will be configured here in a future update.</p>
      </section>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import AdminLayout from '@/components/admin/AdminLayout.vue'
</script>

<style scoped>
.admin-blog-settings {
  padding: 2rem;
}

.admin-blog-settings__header {
  margin-bottom: 2rem;
}

.admin-blog-settings__header h1 {
  margin: 0 0 0.5rem 0;
  font-size: 1.75rem;
}

.admin-blog-settings__subtitle {
  margin: 0;
  color: var(--text-muted, #6b7280);
}

.admin-blog-settings__section {
  padding: 1.5rem;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 8px;
}

.admin-blog-settings__section h2 {
  margin: 0 0 0.75rem 0;
  font-size: 1.125rem;
}

.admin-blog-settings__section p {
  margin: 0;
  color: var(--text-muted, #6b7280);
}
</style>
