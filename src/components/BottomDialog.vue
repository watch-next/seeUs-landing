<template>
  <Teleport to="body">
    <Transition name="bottom-dialog">
      <div v-if="modelValue" class="bottom-dialog-overlay" @click="handleOverlayClick">
        <div
          ref="dialogRef"
          class="bottom-dialog"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          :aria-describedby="describedBy"
          tabindex="-1"
          @keydown="handleKeydown"
        >
          <div class="bottom-dialog__header">
            <h2 v-if="title" :id="titleId" class="bottom-dialog__title">{{ title }}</h2>
            <button
              ref="closeButtonRef"
              class="bottom-dialog__close"
              type="button"
              @click="handleClose"
              aria-label="Close dialog"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <div class="bottom-dialog__content">
            <slot></slot>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps<{
  modelValue: boolean
  title?: string
  describedBy?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'close'): void
}>()

const dialogRef = ref<HTMLElement | null>(null)
const closeButtonRef = ref<HTMLButtonElement | null>(null)
let previouslyFocused: HTMLElement | null = null

const titleId = computed(() => props.title ? `bottom-dialog-title-${props.title.toLowerCase().replace(/\s+/g, '-')}` : undefined)

watch(
  () => props.modelValue,
  async (isOpen) => {
    if (isOpen) {
      previouslyFocused = document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null
      await nextTick()
      focusInitial()
    } else {
      await nextTick()
      restoreFocus()
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  restoreFocus()
})

function handleClose() {
  emit('update:modelValue', false)
  emit('close')
}

function handleOverlayClick(event: MouseEvent) {
  if ((event.target as HTMLElement).classList.contains('bottom-dialog-overlay')) {
    handleClose()
  }
}

function focusableElements(): HTMLElement[] {
  const root = dialogRef.value
  if (!root) return []
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      [
        'button:not([disabled])',
        '[href]',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ].join(','),
    ),
  ).filter((element) => element.offsetParent !== null)
}

function focusInitial() {
  closeButtonRef.value?.focus()
  if (document.activeElement === closeButtonRef.value) return
  const first = focusableElements()[0]
  first?.focus()
  if (!first && dialogRef.value) {
    dialogRef.value.focus()
  }
}

function restoreFocus() {
  if (previouslyFocused && document.contains(previouslyFocused)) {
    previouslyFocused.focus()
  }
  previouslyFocused = null
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    handleClose()
    return
  }

  if (event.key !== 'Tab') return

  const focusables = focusableElements()
  if (focusables.length === 0) {
    event.preventDefault()
    dialogRef.value?.focus()
    return
  }

  const currentIndex = focusables.indexOf(document.activeElement as HTMLElement)
  const first = focusables[0]
  const last = focusables[focusables.length - 1]

  if (event.shiftKey) {
    if (document.activeElement === first || currentIndex === -1) {
      event.preventDefault()
      last.focus()
    }
    return
  }

  if (document.activeElement === last || currentIndex === -1) {
    event.preventDefault()
    first.focus()
  }
}
</script>

<style scoped lang="scss">
@use '@/style/variables' as *;

.bottom-dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: $z-modal;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba($color-background, 0.6);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.bottom-dialog {
  position: relative;
  width: 100%;
 /* max-width: 600px; */
  max-height: 90vh;
  margin: 0;
  background: $color-surface;
  border-top: 1px solid $color-border;
  border-radius: $radius-2xl $radius-2xl 0 0;
  box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.4);
  overflow: hidden;

  @media (max-width: 639px) {
    max-height: 95vh;
    border-radius: $radius-xl $radius-xl 0 0;
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: $space-6 $space-6;
    border-bottom: 1px solid $color-border;
    background: $color-surface;
  }

  &__title {
    font-size: $text-xl;
    font-weight: $weight-semibold;
    color: $color-text;
    margin: 0;
  }

  &__close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    padding: 0;
    background: transparent;
    border: none;
    border-radius: $radius-md;
    color: $color-text-secondary;
    cursor: pointer;
    transition: all $transition-fast;

    &:hover {
      background: $color-glass;
      color: $color-text;
    }

    &:active {
      transform: scale(0.95);
    }
  }

  &__content {
    padding: $space-6;
    overflow-y: auto;
    max-height: calc(90vh - 80px);

    @media (max-width: 639px) {
      max-height: calc(95vh - 80px);
    }
  }
}

// Transition
.bottom-dialog-enter-active,
.bottom-dialog-leave-active {
  transition: all $duration-slower $ease-out;
}

.bottom-dialog-enter-from,
.bottom-dialog-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

.bottom-dialog-enter-from .bottom-dialog-overlay,
.bottom-dialog-leave-to .bottom-dialog-overlay {
  opacity: 0;
}

.bottom-dialog-enter-active .bottom-dialog-overlay,
.bottom-dialog-leave-active .bottom-dialog-overlay {
  transition: opacity $duration-slower $ease-out;
}
</style>
