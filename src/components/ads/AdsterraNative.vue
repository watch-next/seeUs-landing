<template>
  <div
    v-if="adsterraConfig.enabled"
    class="adsterra-native"
    role="complementary"
    aria-label="Advertisement"
  >
    <div
      ref="containerRef"
      class="adsterra-native__container"
      id="container-32b46174a164c051854edda58269cb28"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { adsterraConfig } from '@/config/adsterra'

// The Native Banner container ID is unique and supplied by Adsterra.
const NATIVE_CONTAINER_ID = 'container-32b46174a164c051854edda58269cb28'
const NATIVE_SCRIPT_SRC =
  'https://pl31246408.profitableratecpmnetwork.com/32b46174a164c051854edda58269cb28/invoke.js'

const containerRef = ref<HTMLElement | null>(null)

// Dedupe helpers scoped to this component; shared on window so multiple mounts
// of AdsterraNative never inject the same script/container more than once.
interface AdsterraNativeState {
  scriptLoaded?: boolean
}

declare global {
  interface Window {
    __adsterraNative?: AdsterraNativeState
  }
}

function loadNativeScript(): void {
  if (typeof window === 'undefined') return
  const state = window.__adsterraNative as AdsterraNativeState | undefined
  if (state?.scriptLoaded) return
  if (document.getElementById('adsterra-native-invoke')) return

  const script = document.createElement('script')
  script.id = 'adsterra-native-invoke'
  script.src = NATIVE_SCRIPT_SRC
  script.async = true
  script.setAttribute('data-cfasync', 'false')
  document.head.appendChild(script)

  ;(window.__adsterraNative as AdsterraNativeState) = { scriptLoaded: true }
}

onMounted(() => {
  if (!adsterraConfig.enabled) return

  const container = containerRef.value
  if (!container) return

  // Only inject the script if this container is the single mounted instance,
  // avoiding duplicate containers when the same ID would otherwise collide.
  const existing = document.getElementById(NATIVE_CONTAINER_ID)
  if (existing && existing !== container) {
    // Another instance already owns the real container; skip.
    return
  }

  loadNativeScript()
})
</script>

<style scoped>
.adsterra-native {
  display: flex;
  justify-content: center;
  width: 100%;
  padding: $space-6 $space-4;
  overflow: hidden;
  box-sizing: border-box;
}

.adsterra-native__container {
  display: flex;
  justify-content: center;
  width: 100%;
  max-width: 100%;
  min-height: 1px;
  overflow: hidden;
}
</style>