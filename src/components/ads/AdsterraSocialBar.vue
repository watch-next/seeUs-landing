<template>
  <!-- Empty by design: Adsterra Social Bar injects a fixed-position script. -->
  <div v-if="shouldRender" ref="mountRef" class="adsterra-social" aria-hidden="true"></div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { adsterraConfig } from '@/config/adsterra'
import { usePremiumStatus } from '@/composables/usePremiumStatus'

// Full Adsterra Social Bar script URL. Supplied by the publisher dashboard.
const SOCIAL_BAR_SCRIPT_ID = 'adsterra-social-invoke'

interface AdsterraSocialState {
  scriptLoaded?: boolean
}

declare global {
  interface Window {
    __seeusSocialBarLoaded?: AdsterraSocialState
  }
}

const route = useRoute()
const mountRef = ref<HTMLElement | null>(null)

const { isPremiumActive, checkPremiumStatus } = usePremiumStatus()

// Never show on admin, premium success, or auth callback pages.
const isExcludedRoute = computed(() => {
  if (route.path.startsWith('/admin')) return true
  if (route.path === '/premium/success') return true
  if (route.path === '/auth/callback') return true
  return false
})

const shouldRender = computed(
  () =>
    adsterraConfig.socialBar.enabled &&
    adsterraConfig.socialBar.scriptUrl.length > 0 &&
    !isPremiumActive.value &&
    !isExcludedRoute.value,
)

async function maybeInject(): Promise<void> {
  await checkPremiumStatus()
  if (!shouldRender.value) return
  if (typeof window === 'undefined') return

  let state = window.__seeusSocialBarLoaded as AdsterraSocialState | undefined
  if (state?.scriptLoaded) return
  if (document.getElementById(SOCIAL_BAR_SCRIPT_ID)) return

  const script = document.createElement('script')
  script.id = SOCIAL_BAR_SCRIPT_ID
  script.src = adsterraConfig.socialBar.scriptUrl
  script.async = true
  script.setAttribute('data-cfasync', 'false')
  document.body.appendChild(script)

  state = window.__seeusSocialBarLoaded as AdsterraSocialState | undefined
  ;(window.__seeusSocialBarLoaded as AdsterraSocialState) = {
    ...state,
    scriptLoaded: true,
  }
}

watch(
  () => route.path,
  () => {
    // Single global instance: unchanged once injected for this page lifecycle.
    void maybeInject()
  },
  { immediate: true },
)
</script>

<style scoped>
.adsterra-social {
  display: none;
}
</style>