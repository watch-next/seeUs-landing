<template>
  <main class="auth-callback">
    <div class="auth-callback__panel">
      <p class="auth-callback__status">{{ status }}</p>
      <p v-if="error" class="auth-callback__status auth-callback__status--error">{{ error }}</p>
    </div>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { commentsSupabase } from '@/services/comments/client'
import { providerRegistry } from '@/services/comments/providers/registry'

const router = useRouter()
const RETURN_URL_KEY = 'comment_auth_return_url'

const status = ref('Connecting your account...')
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

function clearUrlFragment(): void {
  const cleanUrl = `${window.location.pathname}${window.location.search}`
  window.history.replaceState({}, document.title, cleanUrl)
}

function readOAuthHashSession():
  | { access_token: string; refresh_token: string }
  | null {
  const fragment = window.location.hash
  if (!fragment) {
    return null
  }

  const params = new URLSearchParams(fragment.startsWith('#') ? fragment.slice(1) : fragment)
  const accessToken = params.get('access_token')
  const refreshToken = params.get('refresh_token')

  if (!accessToken || !refreshToken) {
    return null
  }

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
  }
}

onMounted(async () => {
  try {
    const code = new URLSearchParams(window.location.search).get('code')
    if (code) {
      const { error: exchangeError } = await commentsSupabase.auth.exchangeCodeForSession(code)
      if (exchangeError) {
        const isMissingVerifier =
          typeof exchangeError.message === 'string' &&
          exchangeError.message.toLowerCase().includes('code verifier')

        if (!isMissingVerifier) {
          throw exchangeError
        }
      }
    }

    const hashSession = readOAuthHashSession()
    if (hashSession) {
      const { error: sessionError } = await commentsSupabase.auth.setSession(hashSession)
      if (sessionError) {
        throw sessionError
      }
    }

    const { data, error: sessionError } = await commentsSupabase.auth.getSession()
    if (sessionError) {
      throw sessionError
    }

    if (!data.session?.user) {
      throw new Error('Unable to restore session.')
    }

    // Detect provider from the session user metadata (Supabase sets this).
    const identities = data.session.user.identities ?? []
    const socialIdentity = identities.find(
      (i: { provider?: string }) => i.provider === 'google' || i.provider === 'facebook',
    )
    const detectedProvider = socialIdentity?.provider

    let providerKey: 'google' | 'facebook'
    if (detectedProvider === 'google' || detectedProvider === 'facebook') {
      providerKey = detectedProvider
    } else {
      // Fallback: try to infer from user metadata
      const hasGoogle =
        data.session.user.user_metadata?.iss?.includes('google') ||
        data.session.user.email?.endsWith('@gmail.com')
      providerKey = hasGoogle ? 'google' : 'facebook'
    }

    status.value = `Connecting ${providerKey === 'google' ? 'Google' : 'Facebook'} account...`

    const profile = await providerRegistry[providerKey].provider.restoreSession()
    if (!profile) {
      throw new Error('Unable to restore session.')
    }

    clearUrlFragment()

    const returnUrl = readReturnUrl()
    try {
      sessionStorage.removeItem(RETURN_URL_KEY)
    } catch {
      /* ignore */
    }

    await router.replace(returnUrl)
  } catch (callbackError) {
    console.error('[AuthCallbackPage] OAuth callback failed', callbackError)
    clearUrlFragment()
    error.value = 'Unable to complete sign-in. Please try again.'
    status.value = 'Authentication failed.'
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
