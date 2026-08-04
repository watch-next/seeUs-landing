<template>
  <div class="auth-selector" role="group" aria-label="Comment sign-in">
    <p class="auth-selector__prompt">Sign in to comment</p>
    <ul class="auth-selector__list" role="list">
      <li v-for="entry in entries" :key="entry.key">
        <button
          type="button"
          class="auth-selector__btn"
          :class="{ 'auth-selector__btn--active': activeProvider === entry.key && entry.ready }"
          :disabled="!entry.ready || busyProvider === entry.key"
          :aria-disabled="!entry.ready || busyProvider === entry.key"
          :aria-pressed="activeProvider === entry.key && entry.ready"
          :title="buttonTitle(entry)"
          @click="onSelect(entry)"
        >
          <span class="auth-selector__icon" aria-hidden="true">{{ entry.icon }}</span>
          <span class="auth-selector__label">
            {{ busyProvider === entry.key ? 'Connecting...' : entry.label }}
          </span>
          <span v-if="!entry.ready" class="auth-selector__badge">Coming Soon</span>
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CommentProvider } from '@/types/comments'
import { providerRegistry } from '@/services/comments/providers/registry'

type ProviderKey = 'anonymous' | 'google' | 'facebook'

const props = withDefaults(
  defineProps<{
    activeProvider?: ProviderKey
    busyProvider?: ProviderKey | null
  }>(),
  {
    activeProvider: 'anonymous',
    busyProvider: null,
  },
)

void props

interface SelectorEntry {
  key: ProviderKey
  label: string
  icon: string
  ready: boolean
}

// Render order is fixed for stable UX. GitHub exists in the registry for
// future use but is intentionally omitted from the selector UI (per the
// task spec: guest / google / facebook only).
const entries = computed<SelectorEntry[]>(() => [
  {
    key: 'anonymous',
    label: 'Continue as Guest',
    icon: 'G',
    ready: providerRegistry.anonymous.ready,
  },
  {
    key: 'google',
    label: 'Continue with Google',
    icon: 'G+',
    ready: providerRegistry.google.ready,
  },
  {
    key: 'facebook',
    label: 'Continue with Facebook',
    icon: 'f',
    ready: providerRegistry.facebook.ready,
  },
])

const emit = defineEmits<{
  select: [payload: { provider: CommentProvider; ready: boolean }]
}>()

function onSelect(entry: SelectorEntry) {
  if (!entry.ready || props.busyProvider === entry.key) return
  emit('select', { provider: entry.key, ready: entry.ready })
}

function buttonTitle(entry: SelectorEntry): string {
  if (!entry.ready) return `${entry.label} is coming soon`
  if (props.busyProvider === entry.key) return 'Connecting...'
  return entry.label
}
</script>

<style lang="scss" scoped>
@use '@/style/variables' as *;

.auth-selector {
  display: flex;
  flex-direction: column;
  gap: $space-2;

  &__prompt {
    color: $color-text-muted;
    font-size: $text-sm;
    margin: 0;
  }

  &__list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-wrap: wrap;
    gap: $space-2;
  }

  &__btn {
    display: inline-flex;
    align-items: center;
    gap: $space-2;
    background: $color-surface;
    border: 1px solid $color-border;
    color: $color-text;
    font-size: $text-sm;
    padding: $space-2 $space-3;
    border-radius: $radius-sm;
    cursor: pointer;
    transition: border-color $transition-fast, color $transition-fast;

    &:hover:not(:disabled) {
      border-color: $color-border-hover;
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.7;
    }

    &--active {
      border-color: $color-primary;
      color: $color-primary;
    }
  }

  &__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: $color-surface-light;
    font-size: $text-xs;
    font-weight: $weight-semibold;
  }

  &__badge {
    font-size: $text-xs;
    color: $color-text-muted;
    font-style: italic;
  }
}
</style>
