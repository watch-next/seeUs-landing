<template>
  <div class="movies-page">
    <div class="container">
      <!-- Header -->
      <header class="movies-page__header">
        <Breadcrumbs :items="[{ label: t('common.home'), to: '/' }, { label: t('movies.title') }]" />
        <h1 class="movies-page__title">{{ t('movies.title') }}</h1>
        <p class="movies-page__subtitle">{{ t('movies.subtitle') }}</p>
      </header>

      <!-- Search Box -->
      <div class="movies-page__search">
       
        <div class="movies-page__search-field">
          <svg
            class="movies-page__search-icon"
            aria-hidden="true"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            id="movie-search"
            v-model="searchQuery"
            type="search"
            :placeholder="t('movies.searchPlaceholder')"
            autocomplete="off"
            class="movies-page__search-input"
          />
          <button
            v-if="searchQuery"
            type="button"
            class="movies-page__search-clear"
            @click="searchQuery = ''"
            :aria-label="t('movies.clearSearch')"
          >
            <svg
              aria-hidden="true"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

        <!-- AdSense Banner -->
      <AdSenseAd
        format="auto"
        layout="in-feed"
        responsive
        class="movies-page__ad"
      />

      <!-- Search Results Counter -->
      <div v-if="movies.length > 0 && searchQuery" class="movies-page__search-results">
        {{ t('movies.searchResults', { count: filteredMovies.length, query: searchQuery }) }}
      </div>

      <!-- Loading State -->
      <div
        v-if="loading"
        class="movies-page__loading"
        aria-live="polite"
      >
        <p class="movies-page__loading-message">{{ t('movies.loading') }}</p>
        <div class="movies-page__grid" aria-hidden="true">
          <div
            v-for="n in 8"
            :key="n"
            class="movie-card movie-card--skeleton"
          >
            <div class="movie-card__poster-wrapper">
              <div class="movie-card__skeleton-block"></div>
            </div>
            <div class="movie-card__content">
              <div class="movie-card__skeleton-line movie-card__skeleton-line--title"></div>
              <div class="movie-card__skeleton-line movie-card__skeleton-line--meta"></div>
              <div class="movie-card__skeleton-line movie-card__skeleton-line--desc"></div>
              <div class="movie-card__skeleton-line movie-card__skeleton-line--tags"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="movies-page__empty">
        <div class="movies-page__empty-icon" aria-hidden="true">◌</div>
        <p class="movies-page__empty-title">{{ t('movies.loadError') }}</p>
        <p class="movies-page__empty-text">{{ t('movies.loadErrorDescription') }}</p>
        <button
          type="button"
          class="btn btn-secondary"
          @click="loadMovies"
        >
          {{ t('movies.retry') }}
        </button>
      </div>

      <!-- Empty State -->
      <div v-else-if="movies.length === 0" class="movies-page__empty">
        <div class="movies-page__empty-icon" aria-hidden="true">∅</div>
        <p class="movies-page__empty-title">{{ t('movies.noMoviesAvailable') }}</p>
        <p class="movies-page__empty-text">{{ t('movies.noMoviesAvailableDescription') }}</p>
      </div>

      <!-- Movies Grid -->
      <div v-else class="movies-page__grid">
        <router-link
          v-for="movie in filteredMovies"
          :key="movie.slug"
          :to="`/movies/${movie.slug}`"
          class="movie-card"
        >
          <div class="movie-card__poster-wrapper">
            <img
              :src="movie.cover"
              :alt="movie.title"
              class="movie-card__poster"
              loading="lazy"
            />
            <div v-if="formatRating(movie.rating)" class="movie-card__rating">
              <span aria-hidden="true">★</span>
              <span>{{ formatRating(movie.rating) }}</span>
            </div>
          </div>
          <div class="movie-card__content">
            <h2 class="movie-card__title">{{ movie.title }}</h2>
            <p class="movie-card__meta">
              <span class="movie-card__year">{{ movie.releaseYear }}</span>
              <span
                v-if="movie.duration"
                class="movie-card__separator"
                aria-hidden="true"
              >·</span>
              <span v-if="movie.duration" class="movie-card__duration">
                {{ formatDuration(movie.duration) }}
              </span>
            </p>
    <!--        <p class="movie-card__description">{{ movie.description }}</p>
            <div v-if="movie.tags && movie.tags.length" class="movie-card__tags">
              <span
                v-for="tag in movie.tags.slice(0, 3)"
                :key="tag"
                class="movie-card__tag"
              >
                {{ tag }}
              </span>
            </div>-->
          </div>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { getMovies } from '@/lib/content/MovieRepository'
import type { Movie } from '@/lib/content/types'
import { useSeo } from '@/composables/useSeo'
import AdSenseAd from '@/components/ads/AdSenseAd.vue'
import Breadcrumbs from '@/components/Breadcrumbs.vue'

const { t } = useI18n()

const movies = ref<Movie[]>([])
const searchQuery = ref('')
const loading = ref(true)
const error = ref(false)

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}h ${mins}m`
}

function formatRating(rating: unknown): string | null {
  if (rating === null || rating === undefined) return null

  const num = Number(rating)
  if (Number.isNaN(num)) return null

  // Accept ratings between 0 and 10 (inclusive)
  if (num < 0 || num > 10) return null

  // Format to one decimal place
  return num.toFixed(1)
}

function normalizeSearchText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function searchMovies(query: string): Movie[] {
  const normalizedQuery = normalizeSearchText(query)

  if (!normalizedQuery) {
    return movies.value
  }

  return movies.value.filter((movie) =>
    normalizeSearchText(movie.title).includes(normalizedQuery)
  )
}

const filteredMovies = computed(() => searchMovies(searchQuery.value))
const hasSearchResults = computed(() => filteredMovies.value.length > 0)

// Load movies
async function loadMovies() {
  loading.value = true
  error.value = false
  try {
    movies.value = await getMovies()
  } catch (err) {
    error.value = true
    movies.value = []
  } finally {
    loading.value = false
  }
}

onMounted(loadMovies)

// SEO
// SEO setup (run during component setup, before async operations)
useSeo({
  title: 'Movies | SeeUs',
  description: 'Discover our curated collection of films',
  type: 'website',
})
</script>

<style lang="scss" scoped>
.movies-page {
  padding: clamp(1rem, 3vw, 2rem) 0 clamp(2rem, 4vw, 4rem);

  &__header {
    margin-bottom: clamp(1.5rem, 3vw, 2.5rem);
  }

  &__breadcrumb {
    margin-bottom: clamp(0.75rem, 1.5vw, 1.25rem);
    font-size: clamp(0.875rem, 1.5vw, 1rem);
  }

  &__title {
    font-size: clamp(1.5rem, 3vw, 2.5rem);
    font-weight: 700;
    letter-spacing: -0.02em;
    color: var(--text-primary);
    margin: 0 0 0.5rem 0;
    line-height: 1.2;
  }

  &__subtitle {
    font-size: clamp(0.9375rem, 1.2vw, 1.125rem);
    color: var(--text-secondary);
    margin: 0;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: clamp(0.75rem, 1.5vw, 1.5rem);

    @media (min-width: 520px) {
      grid-template-columns: repeat(3, 1fr);
    }

    @media (min-width: 992px) {
      grid-template-columns: repeat(4, 1fr);
    }

    @media (min-width: 1440px) {
      grid-template-columns: repeat(5, 1fr);
    }
  }

  &__ad {
    margin-bottom: clamp(1.5rem, 3vw, 2.5rem);
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    min-height: 35vh;
    padding: clamp(2rem, 5vw, 4rem) 1rem;
    text-align: center;
    color: var(--text-secondary);
  }

  &__empty-icon {
    font-size: 2.5rem;
    line-height: 1;
    color: var(--accent);
    opacity: 0.5;
  }

  &__empty-title {
    font-size: clamp(1.125rem, 2vw, 1.375rem);
    font-weight: 600;
    color: var(--text-primary);
  }

  &__empty-text {
    margin: 0;
    font-size: clamp(0.875rem, 1.2vw, 1rem);
  }
}

.movie-card {
  display: block;
  background: var(--bg-secondary);
  border-radius: 12px;
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  text-decoration: none;
  color: inherit;

  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35), 0 4px 16px rgba(62, 139, 255, 0.1);
  }

  &__poster-wrapper {
    position: relative;
    aspect-ratio: 2 / 3;
    overflow: hidden;
    background: var(--bg-tertiary);
  }

  &__poster {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }

  &:hover &__poster {
    transform: scale(1.03);
  }

  &__rating {
    position: absolute;
    top: 0.625rem;
    right: 0.625rem;
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    background: rgba(18, 22, 64, 0.92);
    color: var(--accent);
    padding: 0.25rem 0.625rem;
    border-radius: 999px;
    font-size: clamp(0.75rem, 1.5vw, 0.8125rem);
    font-weight: 600;
    min-height: 28px;
    min-width: 28px;
    justify-content: center;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(114, 85, 255, 0.15);
    border: 1px solid rgba(114, 85, 255, 0.2);

    @media (max-width: 480px) {
      top: 0.5rem;
      right: 0.5rem;
      padding: 0.1875rem 0.5rem;
      min-height: 26px;
      min-width: 26px;
      font-size: 0.75rem;
    }
  }

  &__content {
    padding: clamp(0.75rem, 2vw, 1rem);
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  &__title {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
    min-height: calc(1.35em * 2);
    font-size: clamp(0.875rem, 2vw, 1rem);
    font-weight: 600;
    line-height: 1.35;
    color: var(--text-primary);
    margin: 0;
    overflow-wrap: anywhere;
  }

  &__meta {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.375rem;
    font-size: clamp(0.75rem, 1.5vw, 0.8125rem);
    font-weight: 500;
    color: var(--text-secondary);
    margin: 0;
  }

  &__year,
  &__duration {
    font-weight: 500;
  }

  &__separator {
    color: var(--text-secondary);
    opacity: 0.4;
  }

  &__description {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    overflow: hidden;
    font-size: clamp(0.75rem, 1.5vw, 0.8125rem);
    line-height: 1.5;
    color: var(--text-secondary);
    margin: 0;
    font-weight: 400;
  }

  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
    margin-top: auto;
    padding-top: 0.25rem;
  }

  &__tag {
    padding: 0.1875rem 0.5rem;
    background: var(--bg-tertiary);
    color: var(--text-secondary);
    border-radius: 999px;
    font-size: clamp(0.625rem, 1vw, 0.6875rem);
    font-weight: 500;
    border: 1px solid var(--border-color, rgba(255, 255, 255, 0.06));
    transition: border-color 0.2s ease, color 0.2s ease;

    &:hover {
      border-color: var(--accent);
      color: var(--text-primary);
    }
  }

  // Skeleton loading
  &--skeleton {
    pointer-events: none;
  }

  &__skeleton-block {
    width: 100%;
    height: 100%;
  }

  &__skeleton-line {
    border-radius: 6px;
  }

  &__skeleton-line--title {
    height: 1.1rem;
    width: 85%;
    margin-bottom: 0.5rem;
  }

  &__skeleton-line--meta {
    height: 0.85rem;
    width: 45%;
  }

  &__skeleton-line--desc {
    height: 0.85rem;
    width: 70%;
    margin-bottom: 0.375rem;
  }

  &__skeleton-line--tags {
    height: 0.85rem;
    width: 60%;
  }

  &__skeleton-block,
  &__skeleton-line {
    background: linear-gradient(90deg, var(--bg-tertiary) 25%, #1a1f55 50%, var(--bg-tertiary) 75%);
    background-size: 200% 100%;
    animation: movieCardShimmer 1.4s linear infinite;
  }
}

@keyframes movieCardShimmer {
  from {
    background-position: 200% 0;
  }
  to {
    background-position: -200% 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .movie-card,
  .movie-card__poster,
  .movie-card__skeleton-block,
  .movie-card__skeleton-line {
    animation: none;
    transition: none;
  }

  .movie-card:hover {
    transform: none;
    box-shadow: none;
  }

  .movie-card:hover .movie-card__poster {
    transform: none;
  }
}

// Search box styles
.movies-page__search {
  margin-bottom: clamp(1rem, 2vw, 1.5rem);
}

.movies-page__search-field {
  display: flex;
  align-items: center;
  background: var(--bg-tertiary);
  border: 1px solid var(--bg-secondary);
  border-radius: 12px;
  padding: 0 1rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  width: 100%;
  max-width: 520px;

  &:focus-within {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(114, 85, 255, 0.2);
  }
}

.movies-page__search-icon {
  color: var(--text-secondary);
  opacity: 0.6;
  margin-right: 0.75rem;
  flex-shrink: 0;
}

.movies-page__search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-primary);
  font-size: 1rem;
  line-height: 1.5;
  min-height: 44px;
  padding: 0.75rem 0;

  &::placeholder {
    color: var(--text-secondary);
    opacity: 0.6;
  }
}

.movies-page__search-clear {
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  opacity: 0.6;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  transition: color 0.2s ease, opacity 0.2s ease, background 0.2s ease;
  min-width: 40px;
  min-height: 40px;

  &:hover {
    color: var(--text-primary);
    opacity: 1;
    background: rgba(255, 255, 255, 0.08);
  }

  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
}

// Search results counter
.movies-page__search-results {
  margin-top: 0.5rem;
  margin-bottom: clamp(1rem, 2vw, 1.5rem);
  font-size: 0.875rem;
  color: var(--text-secondary);
}

// Loading state
.movies-page__loading {
  margin-top: clamp(1rem, 2vw, 2rem);
}

.movies-page__loading-message {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 1rem;
}

// Error state
.movies-page__error {
  margin-top: clamp(1rem, 2vw, 2rem);
}
</style>