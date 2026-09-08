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
      :data-adsterra-unit="unitId"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, computed } from 'vue'
import { adsterraConfig } from '@/config/adsterra'

type AdsterraFormat =
  | '728x90'
  | '468x60'
  | '300x250'
  | '160x600'
  | '160x300'
  | '320x50'

interface AdsterraFormatConfig {
  key: string
  width: number
  height: number
  script: string
}

// Official Adsterra configurations. Keys, dimensions and URLs must not change.
const FORMATS: Record<AdsterraFormat, AdsterraFormatConfig> = {
  '728x90': {
    key: '18edba3d817bfdf664d51648f42b40e4',
    width: 728,
    height: 90,
    script:
      'https://www.highrevenueformat.com/18edba3d817bfdf664d51648f42b40e4/invoke.js',
  },
  '468x60': {
    key: '3e9ff9ad914d4f6ad834f6862e6ee0be',
    width: 468,
    height: 60,
    script:
      'https://www.highrevenueformat.com/3e9ff9ad914d4f6ad834f6862e6ee0be/invoke.js',
  },
  '300x250': {
    key: '64d77de1a2f8470ca82fbc644c29d1c5',
    width: 300,
    height: 250,
    script:
      'https://www.highrevenueformat.com/64d77de1a2f8470ca82fbc644c29d1c5/invoke.js',
  },
  '160x600': {
    key: 'f6dddb8d4b804c8fd4888e2989a4170a',
    width: 160,
    height: 600,
    script:
      'https://www.highrevenueformat.com/f6dddb8d4b804c8fd4888e2989a4170a/invoke.js',
  },
  '160x300': {
    key: 'b6d3d91e48b4257a74ea01bb9e43fc73',
    width: 160,
    height: 300,
    script:
      'https://www.highrevenueformat.com/b6d3d91e48b4257a74ea01bb9e43fc73/invoke.js',
  },
  '320x50': {
    key: 'b31acf1d4f5be20926d34a44d5971e69',
    width: 320,
    height: 50,
    script:
      'https://www.highrevenueformat.com/b31acf1d4f5be20926d34a44d5971e69/invoke.js',
  },
}

const props = withDefaults(
  defineProps<{
    /** Primary format rendered by default (and on desktop). */
    format: AdsterraFormat
    /** Optional format rendered below the breakpoint (mobile). */
    mobileFormat?: AdsterraFormat
    /** Responsive switch breakpoint in pixels. Defaults to 768px (md). */
    breakpoint?: number
  }>(),
  {
    mobileFormat: undefined,
    breakpoint: 768,
  },
)

// Module-level counter is NOT enough: <script setup> runs per instance, so it
// would reset to 0 on every mount and produce duplicate data-adsterra-unit IDs.
// Window-backed counter guarantees a globally unique unit id per instance.
function nextUnitId(): string {
  const w = window as unknown as { __adsterraUnitCounter?: number }
  w.__adsterraUnitCounter = (w.__adsterraUnitCounter ?? 0) + 1
  return `adsterra-unit-${w.__adsterraUnitCounter}`
}

const containerRef = ref<HTMLElement | null>(null)
const unitId = ref(nextUnitId())

// Dedupe helpers scoped to this component; shared on window so multiple mounts
// of AdsterraBanner never inject the same format's script more than once.
interface AdsterraBannerState {
  [formatKey: string]: boolean
}

declare global {
  interface Window {
    __adsterraBanner?: AdsterraBannerState
  }
}

const isNarrow = ref(false)
let mediaQuery: MediaQueryList | null = null

const activeFormat = computed<AdsterraFormat>(() => {
  if (!props.mobileFormat) return props.format
  return isNarrow.value ? props.mobileFormat : props.format
})

function loadFormatScript(format: AdsterraFormat): void {
  if (typeof window === 'undefined') return
  const config = FORMATS[format]
  if (!config) return

  const state = window.__adsterraBanner ?? {}
  if (state[config.key]) return

  const scriptId = `adsterra-invoke-${config.key}`
  if (document.getElementById(scriptId)) return

  // The Adsterra invoke script reads `atOptions` synchronously from the global
  // scope. Assign it immediately before injecting this format's script so a
  // later banner never overwrites a pending unit's configuration.
  ;(window as unknown as { atOptions?: Record<string, unknown> }).atOptions = {
    key: config.key,
    format: 'iframe',
    height: config.height,
    width: config.width,
    params: {},
  }

  const script = document.createElement('script')
  script.id = scriptId
  script.src = config.script
  script.async = true
  script.setAttribute('data-cfasync', 'false')
  document.head.appendChild(script)

  window.__adsterraBanner = { ...state, [config.key]: true }
}

function onMediaChange(event: MediaQueryListEvent | MediaQueryList): void {
  isNarrow.value = event.matches
  // Re-initialize whenever the active format changes (script already deduped).
  loadFormatScript(activeFormat.value)
}

onMounted(() => {
  if (!adsterraConfig.enabled) return
  if (!containerRef.value) return

  if (props.mobileFormat && typeof window !== 'undefined' && window.matchMedia) {
    mediaQuery = window.matchMedia(`(max-width: ${props.breakpoint}px)`)
    isNarrow.value = mediaQuery.matches
    mediaQuery.addEventListener('change', onMediaChange)
  }

  loadFormatScript(activeFormat.value)
})

onBeforeUnmount(() => {
  if (mediaQuery) {
    mediaQuery.removeEventListener('change', onMediaChange)
    mediaQuery = null
  }
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
  align-items: center;
  width: 100%;
  max-width: 100%;
  min-height: 1px;
  overflow: hidden;
}
</style>