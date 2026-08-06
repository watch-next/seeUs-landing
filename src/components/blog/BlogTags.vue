<template>
  <div class="blog-tags">
    <h3 class="blog-tags__title">{{ t('blog.tags') }}</h3>
    <div class="blog-tags__cloud" aria-label="Blog tags">
      <button
        v-for="tag in tags"
        :key="tag"
        :class="['blog-tags__item', { active: tag === selectedTag }]"
        @click="selectTag(tag)"
      >
        {{ tag }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { BlogPost } from '@/blog'

const { t } = useI18n()

const props = defineProps<{
  posts: BlogPost[]
  selectedTag?: string
}>()

const emit = defineEmits<{
  (e: 'tag-select', tag: string | null): void
}>()

const tags = computed(() => {
  const tagSet = new Set<string>()
  props.posts.forEach(post => {
    post.tags.forEach(tag => tagSet.add(tag))
  })
  return Array.from(tagSet).sort()
})

const selectTag = (tag: string) => {
  if (tag === props.selectedTag) {
    emit('tag-select', null)
  } else {
    emit('tag-select', tag)
  }
}
</script>

<style lang="scss" scoped>
@use '@/style/variables' as *;

.blog-tags {
  margin-bottom: $space-8;

  &__title {
    font-size: $text-lg;
    font-weight: $weight-semibold;
    margin-bottom: $space-3;
    color: $color-text;
  }

  &__cloud {
    position: relative;
    display: flex;
    flex-wrap: nowrap;
    gap: $space-2;
    overflow-x: auto;
    overflow-y: hidden;
    -webkit-overflow-scrolling: touch;
    scroll-behavior: smooth;
    padding: $space-1 0 $space-2;
    margin-inline: calc(-1 * #{$space-1});
    padding-inline: $space-1;
    scrollbar-width: none;
    -ms-overflow-style: none;

    &::-webkit-scrollbar {
      display: none;
    }

    &::before,
    &::after {
      content: '';
      position: absolute;
      top: 0;
      bottom: 0;
      width: $space-6;
      pointer-events: none;
      z-index: 2;
    }

    &::before {
      left: 0;
      background: linear-gradient(90deg, $color-background 20%, rgba($color-background, 0));
    }

    &::after {
      right: 0;
      background: linear-gradient(270deg, $color-background 20%, rgba($color-background, 0));
    }
  }

  &__item {
    flex: 0 0 auto;
    padding: $space-1 $space-4;
    min-height: 2rem;
    background: $gradient-surface;
    border: 1px solid $color-border;
    border-radius: $radius-full;
    color: $color-text-secondary;
    font-size: $text-sm;
    font-weight: $weight-medium;
    line-height: 1;
    cursor: pointer;
    transition: all $transition-base;

    &:hover {
      border-color: $color-border-hover;
      color: $color-text;
    }

    &.active {
      background: $color-primary-light;
      border-color: $color-primary;
      color: $color-primary;
    }
  }
}
</style>







