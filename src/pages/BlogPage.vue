<template>
  <div class="blog-page">
    <div class="container blog-page__container">
      <header class="blog-page__header">
        <h1 class="blog-page__title">{{ t('blog.title') }}</h1>
        <p class="blog-page__subtitle">{{ t('blog.subtitle') }}</p>
      </header>

      <!-- AdSense Banner -->
      <AdSenseAd
        format="auto"
        layout="fixed"
        responsive
        class="blog-page__ad"
      />

      <BlogSearch @search="handleSearch" />

      <div class="blog-page__filters">
        <BlogCategories
          :posts="posts"
          :selected-category="selectedCategory"
          @category-select="handleCategorySelect"
        />
        <BlogTags
          :posts="posts"
          :selected-tag="selectedTag"
          @tag-select="handleTagSelect"
        />
      </div>

      <BlogList
        :posts="posts"
        :filtered-slugs="paginatedSlugs"
      />

      <nav
        v-if="filteredSlugs.length > 0 && totalPages > 1"
        class="blog-page__pagination"
        aria-label="Blog pagination"
      >
        <button
          type="button"
          class="blog-page__page-btn blog-page__page-btn--nav"
          :disabled="currentPage === 1"
          aria-label="Previous page"
          @click="goToPage(currentPage - 1)"
        >
          ‹ Previous
        </button>

        <ul class="blog-page__pages">
          <li v-for="page in pageNumbers" :key="page">
            <button
              type="button"
              class="blog-page__page-btn"
              :class="{ 'blog-page__page-btn--active': page === currentPage }"
              :aria-current="page === currentPage ? 'page' : undefined"
              @click="goToPage(page)"
            >
              {{ page }}
            </button>
          </li>
        </ul>

        <button
          type="button"
          class="blog-page__page-btn blog-page__page-btn--nav"
          :disabled="currentPage === totalPages"
          aria-label="Next page"
          @click="goToPage(currentPage + 1)"
        >
          Next ›
        </button>
      </nav>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { SupabaseBlogProvider, buildSearchIndex, searchPosts } from '@/blog'
import BlogSearch from '@/components/blog/BlogSearch.vue'
import BlogList from '@/components/blog/BlogList.vue'
import BlogCategories from '@/components/blog/BlogCategories.vue'
import BlogTags from '@/components/blog/BlogTags.vue'
import AdSenseAd from '@/components/ads/AdSenseAd.vue'

const { t } = useI18n()

const posts = ref<Awaited<ReturnType<typeof SupabaseBlogProvider.prototype.getPosts>>>([])
const searchQuery = ref('')
const selectedCategory = ref<string | undefined>()
const selectedTag = ref<string | undefined>()

const blogProvider = new SupabaseBlogProvider()

onMounted(async () => {
  posts.value = await blogProvider.getPosts()
})

const searchIndex = computed(() => buildSearchIndex(posts.value))

const filteredSlugs = computed(() => {
  let result = posts.value.map(p => p.slug)

  if (searchQuery.value) {
    const matched = searchPosts(searchQuery.value, searchIndex.value)
    result = result.filter(slug => matched.includes(slug))
  }

  if (selectedCategory.value) {
    result = result.filter(slug => {
      const post = posts.value.find(p => p.slug === slug)
      return post?.category === selectedCategory.value
    })
  }

  if (selectedTag.value) {
    result = result.filter(slug => {
      const post = posts.value.find(p => p.slug === slug)
      return post?.tags.includes(selectedTag.value || '')
    })
  }

  return result
})

const handleSearch = (query: string) => {
  searchQuery.value = query
}

const handleCategorySelect = (category: string | null) => {
  selectedCategory.value = category || undefined
}

const handleTagSelect = (tag: string | null) => {
  selectedTag.value = tag || undefined
}

// ── Pagination ───────────────────────────────────────────────────────────
const POSTS_PER_PAGE = 10
const currentPage = ref(1)

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredSlugs.value.length / POSTS_PER_PAGE))
)

const paginatedSlugs = computed(() => {
  const start = (currentPage.value - 1) * POSTS_PER_PAGE
  return filteredSlugs.value.slice(start, start + POSTS_PER_PAGE)
})

const pageNumbers = computed(() =>
  Array.from({ length: totalPages.value }, (_, i) => i + 1)
)

// Reset to page 1 whenever filters/search change
watch([searchQuery, selectedCategory, selectedTag], () => {
  currentPage.value = 1
})

const goToPage = (page: number) => {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
}
</script>

<style lang="scss" scoped>
@use '@/style/variables' as *;

.blog-page {
  min-height: 100vh;
  padding-block: $space-20 $space-16;
  padding-inline: $space-6;
  background: $color-background;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 80%;
    max-width: 1200px;
    height: 400px;
    background: radial-gradient(ellipse 80% 60% at 50% 0%,
      rgba($color-primary, 0.12) 0%,
      transparent 60%);
    z-index: $z-base;
    pointer-events: none;
  }

  @media (max-width: 768px) {
    padding-block: $space-16 $space-12;
  }
}

.blog-page__container {
  max-width: $content-max-width;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: $space-8;
  position: relative;
  z-index: $z-base;
}

.blog-page__header {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-3;
}

.blog-page__title {
  font-size: $text-4xl;
  font-weight: $weight-bold;
  color: $color-text;
  margin: 0;
  letter-spacing: $tracking-tight;

  @media (max-width: 768px) {
    font-size: $text-3xl;
  }
}

.blog-page__subtitle {
  font-size: $text-lg;
  color: $color-text-secondary;
  margin: 0;
  max-width: 600px;
  line-height: $leading-relaxed;

  @media (max-width: 768px) {
    font-size: $text-base;
  }
}

.blog-page__filters {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.blog-page__pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: $space-3;
  flex-wrap: wrap;
  padding-block: $space-6;
}

.blog-page__pages {
  list-style: none;
  display: flex;
  gap: $space-2;
  margin: 0;
  padding: 0;
  flex-wrap: wrap;
  justify-content: center;
}

.blog-page__page-btn {
  min-width: 40px;
  min-height: 40px;
  padding: $space-2 $space-3;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: $color-surface;
  color: $color-text-secondary;
  font-size: $text-sm;
  font-weight: $weight-medium;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;

  &:hover:not(:disabled) {
    background: $color-surface-hover;
    border-color: $color-border-hover;
    color: $color-text;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  &--active {
    background: $color-primary;
    border-color: $color-primary;
    color: $color-text;

    &:hover:not(:disabled) {
      background: $color-primary-hover;
      border-color: $color-primary-hover;
      color: $color-text;
    }
  }

  &--nav {
    padding-inline: $space-4;
  }

  @media (max-width: 480px) {
    min-width: 36px;
    min-height: 36px;
    font-size: $text-xs;
  }
}
</style>