<template>
  <div
    v-if="adsterraConfig.enabled"
    class="adsterra-banner"
    role="complementary"
    aria-label="Advertisement"
  >
    <div
      ref="containerRef"
      class="adsterra-banner__slot"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { adsterraConfig } from '@/config/adsterra'

// 728x90 banner config — must remain exactly as supplied by Adsterra.
const BANNER_KEY = '18edba3d817bfdf664d51648f42b40e4'
const BANNER_INVOKE_SRC =
  'https://www.highrevenueformat.com/18edba3d817bfdf664d51648f42b40e4/invoke.js'

const containerRef = ref<HTMLElement | null>(null)

interface AdsterraBannerState {
  scriptLoaded?: boolean
}

declare global {
  interface Window {
    __adsterraBanner?: AdsterraBannerState
  }
}

function loadBannerScript(): void {
  if (typeof window === 'undefined') return
  const state = window.__adsterraBanner as AdsterraBannerState | undefined
  if (state?.scriptLoaded) return
  if (document.getElementById('adsterra-banner-invoke')) return

  // The Adsterra banner script reads `atOptions` from the global scope.
  ;(window as unknown as { atOptions?: Record<string, unknown> }).atOptions = {
    key: BANNER_KEY,
    format: 'iframe',
    height: 90,
    width: 728,
    params: {},
  }

  const script = document.createElement('script')
  script.id = 'adsterra-banner-invoke'
  script.src = BANNER_INVOKE_SRC
  script.async = true
  document.head.appendChild(script)

  ;(window.__adsterraBanner as AdsterraBannerState) = { scriptLoaded: true }
}

onMounted(() => {
  if (!adsterraConfig.enabled) return
  if (!containerRef.value) return
  loadBannerScript()
})
</script>

<style scoped>
.adsterra-banner {
  display: flex;
  justify-content: center;
  width: 100%;
  padding: $space-6 $space-4;
  overflow: hidden;
  box-sizing: border-box;
}

.adsterra-banner__slot {
  display: flex;
  justify-content: center;
  width: 100%;
  max-width: 728px;
  min-height: 90px;
  overflow: hidden;
}
</style>