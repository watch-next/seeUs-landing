<template>
  <div class="movies-page">
    <div class="container">
      <!-- Header -->
      <header class="movies-page__header">
        <nav class="movies-page__breadcrumb">
          <ol class="breadcrumb">
            <li class="breadcrumb__item">
              <router-link to="/" class="breadcrumb__link">
                {{ t('common.home') }}
              </router-link>
            </li>
            <li class="breadcrumb__item" aria-current="page">
              <span class="breadcrumb__current">Movies</span>
            </li>
          </ol>
        </nav>

        <h1 class="movies-page__title">Movies</h1>
        <p class="movies-page__subtitle">
          Discover our curated collection of films
        </p>
      </header>

      <!-- AdSense Banner -->
      <AdSenseAd
        format="auto"
        layout="fixed"
        responsive
        class="movies-page__ad"
      />

      <!-- Loading State -->
      <div
        v-if="loading"
        class="movies-page__grid"
        aria-hidden="true"
      >
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
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="movies-page__empty">
        <div class="movies-page__empty-icon" aria-hidden="true">◌</div>
        <p class="movies-page__empty-title">Unable to load movies</p>
        <p class="movies-page__empty-text">Please try again later.</p>
        <button
          type="button"
          class="btn btn-secondary"
          @click="loadMovies"
        >
          Try again
        </button>
      </div>

      <!-- Empty State -->
      <div v-else-if="movies.length === 0" class="movies-page__empty">
        <div class="movies-page__empty-icon" aria-hidden="true">∅</div>
        <p class="movies-page__empty-title">No movies available yet</p>
        <p class="movies-page__empty-text">Check back soon!</p>
      </div>

      <!-- Movies Grid -->
      <div v-else class="movies-page__grid">
        <router-link
          v-for="movie in movies"
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
            <div v-if="movie.rating" class="movie-card__rating">
              ★ {{ movie.rating }}
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
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { getMovies } from '@/lib/content/MovieRepository'
import type { Movie } from '@/lib/content/types'
import { useSeo } from '@/composables/useSeo'
import AdSenseAd from '@/components/ads/AdSenseAd.vue'

const { t } = useI18n()

const movies = ref<Movie[]>([])
const loading = ref(true)
const error = ref(false)

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}h ${mins}m`
}

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
  padding: clamp(1rem, 2vw + 0.5rem, 2rem) 0 4rem;

  &__header {
    margin-bottom: clamp(1.5rem, 3vw + 0.5rem, 3rem);
  }

  &__breadcrumb {
    margin-bottom: clamp(0.75rem, 1vw + 0.5rem, 1.5rem);
    font-size: clamp(0.875rem, 2vw, 0.975rem);
  }

  &__title {
    font-size: clamp(1.6rem, 2.5vw + 1rem, 2.75rem);
    font-weight: 700;
    letter-spacing: -0.02em;
    color: var(--text-primary);
    margin: 0 0 0.5rem 0;
    line-height: 1.15;
  }

  &__subtitle {
    font-size: clamp(1rem, 1vw + 0.8rem, 1.25rem);
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
    gap: 0.6rem;
    min-height: 30vh;
    padding: clamp(3rem, 8vw, 5rem) 1rem;
    text-align: center;
    color: var(--text-secondary);
  }

  &__empty-icon {
    font-size: 2.5rem;
    line-height: 1;
    color: var(--accent);
    opacity: 0.6;
  }

  &__empty-title {
    font-size: clamp(1.1rem, 2vw, 1.4rem);
    font-weight: 600;
    color: var(--text-primary);
  }

  &__empty-text {
    margin: 0 0 0.5rem;
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
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
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
    transition: transform 0.25s ease;
  }

  &:hover &__poster {
    transform: scale(1.04);
  }

  &__rating {
    position: absolute;
    top: 0.625rem;
    right: 0.625rem;
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    background: rgba(11, 13, 45, 0.85);
    color: var(--accent);
    padding: 0.25rem 0.625rem;
    border-radius: 999px;
    font-size: clamp(0.75rem, 0.5vw + 0.65rem, 0.875rem);
    font-weight: 600;
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.35);

    @media (max-width: 480px) {
      top: 0.5rem;
      right: 0.5rem;
      padding: 0.1875rem 0.5rem;
    }
  }

  &__content {
    padding: clamp(0.75rem, 1vw, 1.25rem);
  }

  &__title {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
    min-height: calc(1.3em * 2);
    font-size: clamp(1rem, 0.6vw + 0.9rem, 1.25rem);
    font-weight: 600;
    line-height: 1.3;
    color: var(--text-primary);
    margin: 0 0 0.5rem 0;
    overflow-wrap: anywhere;
  }

  &__meta {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.375rem;
    font-size: clamp(0.75rem, 0.4vw + 0.7rem, 0.875rem);
    color: var(--text-secondary);
    margin-bottom: 0.75rem;
  }

  &__year,
  &__duration {
    font-weight: 500;
  }

  &__separator {
    color: var(--text-secondary);
    opacity: 0.5;
  }

  &__description {
    font-size: 0.9rem;
    line-height: 1.5;
    color: var(--text-secondary);
    margin: 0 0 0.75rem 0;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  &__tag {
    padding: 0.25rem 0.625rem;
    background: var(--bg-tertiary);
    color: var(--text-primary);
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 500;
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
    height: 1.05rem;
    width: 85%;
    margin-bottom: 0.5rem;
  }

  &__skeleton-line--meta {
    height: 0.85rem;
    width: 45%;
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
}

// Breadcrumb styles (inline, matching blog pattern)
.breadcrumb {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;

  &__item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
  }

  &__link {
    color: var(--text-secondary);
    text-decoration: none;
    transition: color 0.2s ease;

    &:hover {
      color: var(--text-primary);
    }

    &--current {
      color: var(--text-primary);
      font-weight: 500;
      cursor: default;

      &:hover {
        color: var(--text-primary);
      }
    }
  }

  &__separator {
    color: var(--text-secondary);
    opacity: 0.6;
  }
}
</style>