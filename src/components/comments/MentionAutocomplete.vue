<template>
  <ul v-if="candidates.length > 0" class="mention-ac" role="listbox">
    <li
      v-for="(c, i) in candidates"
      :key="c.user_id"
      role="option"
      :aria-selected="i === activeIndex"
      class="mention-ac__item"
      :class="{ 'mention-ac__item--active': i === activeIndex }"
      @mouseenter="$emit('select', c)"
    >
      <img
        class="mention-ac__avatar"
        :src="avatarFor(c)"
        alt=""
        width="24"
        height="24"
        loading="lazy"
      />
      <span class="mention-ac__name">{{ c.display_name }}</span>
    </li>
  </ul>
</template>

<script setup lang="ts">
import type { CommenterSearchRow } from '@/types/comments'

defineProps<{
  candidates: CommenterSearchRow[]
  activeIndex: number
}>()

defineEmits<{
  select: [candidate: CommenterSearchRow]
}>()

const DICEBEAR_BASE = 'https://api.dicebear.com/9.x/bottts-neutral/svg'

function avatarFor(c: CommenterSearchRow): string {
  return `${DICEBEAR_BASE}?seed=${encodeURIComponent(c.avatar_seed)}`
}
</script>

<style lang="scss" scoped>
@use '@/style/variables' as *;

.mention-ac {
  list-style: none;
  margin: 0;
  padding: $space-1;
  background: $color-surface;
  border: 1px solid $color-border;
  border-radius: $radius-sm;
  box-shadow: $shadow-md;
  display: flex;
  flex-direction: column;
  gap: $space-1;
  max-height: 240px;
  overflow-y: auto;

  &__item {
    display: flex;
    align-items: center;
    gap: $space-2;
    padding: $space-1 $space-2;
    border-radius: $radius-sm;
    cursor: pointer;

    &--active,
    &:hover {
      background: $color-glass;
    }
  }

  &__avatar {
    border-radius: 50%;
    background: $color-surface-light;
  }

  &__name {
    color: $color-text;
    font-size: $text-sm;
  }
}
</style>
