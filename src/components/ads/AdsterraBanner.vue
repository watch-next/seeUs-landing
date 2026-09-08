<template>
  <div
    v-if="adsterraConfig.enabled"
    class="adsterra-banner"
    role="complementary"
    aria-label="Advertisement"
  >
    <div
      ref="slotRef"
      class="adsterra-banner__slot"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { adsterraConfig } from '@/config/adsterra'

// Only verified 728x90 Banner unit supplied by the publisher. Do not guess keys.
const ADSTERRA_KEY = '18edba3d817bfdf664d51648f42b40e4'
const ADSTERRA_SCRIPT =
  'https://www.highrevenueformat.com/18edba3d817bfdf664d51648f42b40e4/invoke.js'

const slotRef = ref<HTMLElement | null>(null)
let injectedScript: HTMLScriptElement | null = null

function loadBanner(): void {
  if (typeof window === 'undefined') return
  const slot = slotRef.value
  if (!slot) return

  // Preserve the official order: define `atOptions` BEFORE loading invoke.js.
  // The Adsterra invoke script reads `atOptions` synchronously from the global
  // scope when it executes.
  ;(window as unknown as { atOptions?: Record<string, unknown> }).atOptions = {
    key: ADSTERRA_KEY,
    format: 'iframe',
    height: 90,
    width: 728,
    params: {},
  }

  // Anchor this instance's ad to its OWN slot so each mounted component renders
  // into the correct DOM location (and script is removed on unmount).
  const script = document.createElement('script')
  script.src = ADSTERRA_SCRIPT
  script.async = true
  script.setAttribute('data-cfasync', 'false')
  slot.appendChild(script)
  injectedScript = script
}

onMounted(() => {
  if (!adsterraConfig.enabled) return
  loadBanner()
})

onBeforeUnmount(() => {
  if (injectedScript && injectedScript.parentNode) {
    injectedScript.parentNode.removeChild(injectedScript)
  }
  injectedScript = null
})
</script>

<style scoped>
.adsterra-banner {
  display: flex;
  justify-content: center;
  width: 100%;
  padding: var(--space-6) var(--space-4);
  overflow: hidden;
  box-sizing: border-box;
}

.adsterra-banner__slot {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  max-width: 100%;
  min-height: 1px;
  overflow: hidden;
}
</style>