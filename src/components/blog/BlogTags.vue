<template>
  <div class="blog-tags">
    <h3 class="blog-tags__title">{{ t('blog.tags') }}</h3>
    <div class="blog-tags__list">
      <button
        v-for="tag in visibleTags"
        :key="tag"
        :class="['blog-tags__item', { active: tag === selectedTag }]"
        @click="selectTag(tag)"
      >
        {{ tag }}
      </button>
    </div>
    <button v-if="hasMore" type="button" class="blog-tags__toggle" @click="toggleExpand">
      {{ expanded ? t('blog.viewLess') : t('blog.viewMore') }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { BlogPost } from '@/blog'

const { t } = useI18n()

const TAG_LIMIT = 10

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

const expanded = ref(false)

const hasMore = computed(() => tags.value.length > TAG_LIMIT)

const visibleTags = computed(() => {
  const all = tags.value
  if (expanded.value) return all
  const head = all.slice(0, TAG_LIMIT)
  // If a hidden tag is selected, keep it visible so selection is not lost.
  if (props.selectedTag && !head.includes(props.selectedTag)) {
    return Array.from(new Set([...head, props.selectedTag])).sort()
  }
  return head
})

const toggleExpand = () => {
  expanded.value = !expanded.value
}

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

  &__list {
    display: flex;
    flex-wrap: wrap;
    gap: $space-2;
    justify-content: flex-start;
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
    white-space: nowrap;
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

  &__toggle {
    margin-top: $space-3;
    padding: $space-1 0;
    background: none;
    border: none;
    color: $color-primary;
    font-size: $text-sm;
    font-weight: $weight-medium;
    cursor: pointer;
    text-align: left;
    transition: color $transition-base;

    &:hover {
      color: $color-primary-dark;
      text-decoration: underline;
    }
  }

  @media (max-width: 480px) {
    gap: $space-2;

    &__item {
      padding: $space-1 $space-3;
      min-height: 1.75rem;
      font-size: $text-xs;
    }

    &__list {
      gap: $space-1;
    }
  }
}
</style>







