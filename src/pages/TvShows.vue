<template>
  <div class="tv-shows-page">
    <div class="container">
      <!-- Header -->
      <header class="tv-shows-page__header">
        <Breadcrumbs :items="[{ label: t('common.home'), to: '/' }, { label: t('tvShows.title') }]" />
        <h1 class="tv-shows-page__title">{{ t('tvShows.title') }}</h1>
        <p class="tv-shows-page__subtitle">{{ t('tvShows.subtitle') }}</p>
      </header>

      <!-- Search Box -->
      <div class="tv-shows-page__search">
        <div class="tv-shows-page__search-field">
          <svg class="tv-shows-page__search-icon" aria-hidden="true" width="20" height="20" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input id="tv-show-search" v-model="searchQuery" type="search" :placeholder="t('tvShows.searchPlaceholder')"
            autocomplete="off" class="tv-shows-page__search-input" />
          <button v-if="searchQuery" type="button" class="tv-shows-page__search-clear" @click="searchQuery = ''"
            :aria-label="t('tvShows.clearSearch')">
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>
      <!-- Adsterra Banner -->
      <AdsterraBanner class="tv-shows-page__adsterra" />

      <!-- AdSense Banner -->
      <AdSenseAd format="auto" layout="in-feed" responsive class="tv-shows-page__ad" />

      <!-- Search Results Counter -->
      <div v-if="filteredShows.length > 0 && searchQuery" class="tv-shows-page__search-results">
        {{ t('tvShows.searchResults', { count: filteredShows.length, query: searchQuery }) }}
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="tv-shows-page__loading" aria-live="polite">
        <p class="tv-shows-page__loading-message">{{ t('tvShows.loading') }}</p>
        <div class="tv-shows-page__grid" aria-hidden="true">
          <div v-for="n in 8" :key="n" class="tv-show-card tv-show-card--skeleton">
            <div class="tv-show-card__poster-wrapper">
              <div class="tv-show-card__skeleton-block"></div>
            </div>
            <div class="tv-show-card__content">
              <div class="tv-show-card__skeleton-line tv-show-card__skeleton-line--title"></div>
              <div class="tv-show-card__skeleton-line tv-show-card__skeleton-line--meta"></div>
              <div class="tv-show-card__skeleton-line tv-show-card__skeleton-line--desc"></div>
              <div class="tv-show-card__skeleton-line tv-show-card__skeleton-line--tags"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="tv-shows-page__empty">
        <div class="tv-shows-page__empty-icon" aria-hidden="true">◌</div>
        <p class="tv-shows-page__empty-title">{{ t('tvShows.serverSleeping') }}</p>
        <p class="tv-shows-page__empty-text">{{ t('tvShows.serverSleepingDescription') }}</p>
        <button type="button" class="btn btn-primary" @click="loadShows">
          {{ t('tvShows.wakeServer') }}
        </button>
      </div>

      <!-- Empty State -->
      <div v-else-if="shows.length === 0 && !error" class="tv-shows-page__empty">
         <div class="tv-shows-page__empty-icon" aria-hidden="true">◌</div>
        <p class="tv-shows-page__empty-title">{{ t('tvShows.serverSleeping') }}</p>
        <p class="tv-shows-page__empty-text">{{ t('tvShows.serverSleepingDescription') }}</p>
        <button type="button" class="btn btn-primary" @click="loadShows">
          {{ t('tvShows.wakeServer') }}
        </button>
      </div>

      <!-- Shows Grid -->
      <div v-else class="tv-shows-page__grid">
        <router-link v-for="show in filteredShows" :key="show.slug" :to="`/tv-shows/${show.slug}`" class="tv-show-card">
          <div class="tv-show-card__poster-wrapper">
            <img :src="show.cover" :alt="show.title" class="tv-show-card__poster" loading="lazy" />
          </div>
          <div class="tv-show-card__content">
            <h2 class="tv-show-card__title">{{ show.title }}</h2>
            <p class="tv-show-card__meta">
              <span class="tv-show-card__year">{{ show.firstAirYear }}</span>
              <span v-if="show.seasonCount" class="tv-show-card__separator" aria-hidden="true">·</span>
              <span v-if="show.seasonCount" class="tv-show-card__season-count">
                {{ show.seasonCount }} {{ t('tvShows.seasonsLabel', { count: show.seasonCount }) }}
              </span>
            </p>
            <div v-if="show.tags && show.tags.length" class="tv-show-card__tags">
              <span
                v-for="tag in show.tags.slice(0, 3)"
                :key="tag"
                class="tv-show-card__tag"
              >
                {{ tag }}
              </span>
            </div>
          </div>
        </router-link>
      </div>

      <!-- Adsterra Banner -->
      <AdsterraBanner class="tv-shows-page__adsterra" />

      <!-- AdSense Banner -->
      <AdSenseAd format="auto" layout="in-feed" responsive class="tv-shows-page__ad" />
    </div>

    <AdsterraNative class="tv-shows-page__adsterra-native" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { getSeries } from '@/lib/content/SeriesRepository'
import { useSeo } from '@/composables/useSeo'
import AdSenseAd from '@/components/ads/AdSenseAd.vue'
import AdsterraBanner from '@/components/ads/AdsterraBanner.vue'
import Breadcrumbs from '@/components/Breadcrumbs.vue'
import AdsterraNative from '@/components/ads/AdsterraNative.vue'

type TVShowDetail = Awaited<ReturnType<typeof getSeries>>[number] & {
  slug: string
  cover: string
  title: string
  firstAirYear: number
  seasonCount: number
  tags: string[]
  description: string
}

const { t } = useI18n()

const shows = ref<TVShowDetail[]>([])
const searchQuery = ref('')
const loading = ref(true)
const error = ref(false)
const retryTimeout = ref<ReturnType<typeof setTimeout> | null>(null)
const startTime = ref<number | null>(null)

function clearRetryTimeout() {
  if (retryTimeout.value !== null) {
    clearTimeout(retryTimeout.value);
    retryTimeout.value = null;
  }
}

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

function searchShows(query: string): TVShowDetail[] {
  const normalizedQuery = normalizeSearchText(query)

  if (!normalizedQuery) {
    return shows.value
  }

  return shows.value.filter((show) =>
    normalizeSearchText(show.title).includes(normalizedQuery)
  )
}

const filteredShows = computed(() => searchShows(searchQuery.value))
const hasSearchResults = computed(() => filteredShows.value.length > 0)

// Map TVShowDetail to have properties expected by template
function mapTvShowToViewModel(show: TVShowDetail): TVShowDetail {
  // Extract year from first_air_date (YYYY-MM-DD)
  const firstAirYear = show.first_air_date
    ? parseInt(show.first_air_date.substring(0, 4))
    : new Date().getFullYear()

  // Create slug if not present (SeriesRepository should have added it, but just in case)
  const slug = show.slug || `${show.id}-${show.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`

  // Map genre_ids to genre names if needed
  const tags = show.genres?.map((g: { name: string }) => g.name) || []

  return {
    ...show,
    slug,
    cover: show.poster_path
      ? `https://image.tmdb.org/t/p/w500${show.poster_path}`
      : '/images/no-poster.svg',
    title: show.name,
    firstAirYear,
    seasonCount: show.number_of_seasons || 0,
    tags,
    description: show.overview || '',
  } as TVShowDetail
}

// Load shows with retry mechanism
async function loadShows() {
  clearRetryTimeout()
  startTime.value = null
  attemptLoad()
}

async function attemptLoad() {
  loading.value = true
  error.value = false
  try {
    const fetchedShows = await getSeries()
    shows.value = fetchedShows.map(mapTvShowToViewModel)
    loading.value = false
    clearRetryTimeout()
    startTime.value = null
  } catch (err) {
    if (startTime.value === null) {
      startTime.value = Date.now()
    }
    if (Date.now() - startTime.value >= 30000) {
      loading.value = false
      error.value = true
      clearRetryTimeout()
      startTime.value = null
    } else {
      scheduleRetry()
    }
  }
}

function scheduleRetry() {
  clearRetryTimeout()
  retryTimeout.value = setTimeout(() => {
    attemptLoad()
  }, 5000)
}

onMounted(loadShows)
onUnmounted(() => {
  clearRetryTimeout();
})

// SEO
useSeo({
  title: 'TV Shows | SeeUs',
  description: 'Discover our curated collection of TV series',
  type: 'website',
})
</script>

<style lang="scss" scoped>
.tv-shows-page {
  padding: clamp(1rem, 3vw, 2rem) 0 clamp(2rem, 4vw, 4rem);

  &__header {
    margin-bottom: clamp(1.5rem, 3vw, 2.5rem);
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

  &__search {
    margin-bottom: clamp(1rem, 2vw, 1.5rem);
  }

  &__search-field {
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.5rem;

    .tv-shows-page__search-icon {
      width: 20px;
      height: 20px;
      color: var(--text-muted);
    }

    .tv-shows-page__search-input {
      flex: 1;
      padding: clamp(0.5rem, 1vw, 0.75rem) clamp(0.75rem, 1.5vw, 1rem);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      background-color: var(--bg-surface);
      color: var(--text-primary);
      font-size: clamp(0.875rem, 1.2vw, 1rem);

      &::placeholder {
        color: var(--text-muted);
      }

      &:focus {
        outline: none;
        border-color: var(--primary);
        box-shadow: 0 0 0 2px rgba(var(--primary-rgb), 0.2);
      }
    }

    .tv-shows-page__search-clear {
      position: absolute;
      right: clamp(0.5rem, 1vw, 0.75rem);
      width: 24px;
      height: 24px;
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      padding: 0;

      &:hover {
        color: var(--text-primary);
      }
    }
  }

  &__adsterra,
  &__ad {
    margin-bottom: clamp(1.5rem, 3vw, 2.5rem);
  }

  &__search-results {
    margin-bottom: clamp(0.75rem, 1.5vw, 1.25rem);
    padding: 0 clamp(1rem, 2vw, 1.5rem);
    font-size: clamp(0.875rem, 1.2vw, 1rem);
    color: var(--text-muted);
  }

  &__loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    text-align: center;
    padding: clamp(2rem, 5vw, 4rem) 1rem;

    .tv-shows-page__loading-message {
      font-size: clamp(0.875rem, 1.2vw, 1rem);
      color: var(--text-secondary);
    }

    .tv-shows-page__grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: clamp(0.75rem, 1.5vw, 1.5rem);
      width: 100%;
      max-width: 800px;

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

    .tv-shows-page__empty-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .tv-shows-page__empty-title {
      font-size: clamp(1.125rem, 2vw, 1.5rem);
      font-weight: 600;
      margin-bottom: 0.5rem;
    }

    .tv-shows-page__empty-text {
      font-size: clamp(0.875rem, 1.2vw, 1rem);
      margin-bottom: 1.5rem;
      line-height: 1.5;
    }

    .btn {
      padding: clamp(0.5rem, 1.2vw, 0.75rem) clamp(1rem, 2vw, 1.5rem);
      font-size: clamp(0.875rem, 1.2vw, 1rem);
    }
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
}

.tv-show-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-surface);
  border-radius: var(--radius-sm);
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border: 1px solid var(--border-color);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &--skeleton {
    background: var(--bg-surface);
    border: 1px solid var(--border-color);
  }

  &__poster-wrapper {
    position: relative;
    width: 100%;
    padding-top: 150%; // 2:3 aspect ratio
    overflow: hidden;
    background-color: var(--bg-muted);

    img {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .tv-show-card__skeleton-block {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(
        90deg,
        var(--bg-muted) 0%,
        var(--border-color) 50%,
        var(--bg-muted) 100%
      );
      background-size: 200% 100%;
      animation: loading 1.5s infinite;
    }
  }

  &__content {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: clamp(1rem, 2vw, 1.25rem);
    gap: 0.5rem;

    h2 {
      margin: 0;
      font-size: clamp(0.875rem, 1.5vw, 1.125rem);
      font-weight: 600;
      color: var(--text-primary);
      line-height: 1.3;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    p {
      margin: 0;
      font-size: clamp(0.75rem, 1.2vw, 0.875rem);
      color: var(--text-muted);
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      align-items: center;

      .tv-show-card__separator {
        color: var(--border-color);
      }
    }

    .tv-show-card__tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
      margin-top: 0.25rem;

      .tv-show-card__tag {
        font-size: clamp(0.625rem, 1vw, 0.75rem);
        background-color: var(--bg-muted);
        color: var(--text-muted);
        padding: 0.25rem 0.5rem;
        border-radius: var(--radius-xs);
      }
    }
  }

  &--skeleton {
    &__content {
      .tv-show-card__skeleton-line {
        height: 0.75rem;
        background-color: var(--bg-muted);
        border-radius: var(--radius-xs);
        margin-bottom: 0.25rem;

        &--title {
          width: 60%;
        }

        &--meta {
          width: 40%;
        }

        &--desc {
          width: 80%;
        }

        &--tags {
          width: 60%;
          height: 1rem;
          display: flex;
          gap: 0.25rem;

          span {
            width: 30%;
            height: 100%;
            background-color: var(--bg-muted);
            border-radius: var(--radius-xs);
          }
        }
      }
    }
  }
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>