<template>
  <main class="auth-callback">
    <div class="auth-callback__panel">
      <p v-if="!error" class="auth-callback__status">{{ status }}</p>
      <p v-else class="auth-callback__status auth-callback__status--error">{{ error }}</p>
      <router-link v-if="error" to="/blog" class="btn btn-primary">Back to blog</router-link>
    </div>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { providerRegistry } from '@/services/comments/providers/registry'
import { commentsSupabase } from '@/services/comments/client'

const router = useRouter()
const RETURN_URL_KEY = 'comment_auth_return_url'

const status = ref('Completing Google sign-in...')
const error = ref<string | null>(null)

function readReturnUrl(): string {
  try {
    const value = sessionStorage.getItem(RETURN_URL_KEY)
    if (value && value.startsWith('/')) {
      return value
    }
  } catch {
    /* ignore */
  }
  return '/blog'
}

onMounted(async () => {
  try {
    if (window.location.hash) {
      const cleanUrl = `${window.location.pathname}${window.location.search}`
      window.history.replaceState({}, document.title, cleanUrl)
    }

    await commentsSupabase.auth.getSession()
    const profile = await providerRegistry.google.provider.restoreSession()
    if (!profile) {
      throw new Error('Unable to restore Google session.')
    }

    status.value = 'Sign-in complete. Redirecting...'
    const returnUrl = readReturnUrl()
    try {
      sessionStorage.removeItem(RETURN_URL_KEY)
    } catch {
      /* ignore */
    }
    await router.replace(returnUrl)
  } catch {
    error.value = 'Unable to authenticate with Google. Please try again.'
  }
})
</script>

<style scoped lang="scss">
@use '@/style/variables' as *;

.auth-callback {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: $space-8;
  background: $gradient-surface;

  &__panel {
    width: min(100%, 480px);
    padding: $space-8;
    background: $color-surface;
    border: 1px solid $color-border;
    border-radius: $radius-card;
    box-shadow: $shadow-lg;
    text-align: center;
  }

  &__status {
    margin: 0 0 $space-4;
    color: $color-text;

    &--error {
      color: $color-error;
    }
  }
}
</style>
