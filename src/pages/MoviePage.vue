<template>
  <article v-if="movie" class="movie-page">
    <div class="container movie-page__container">
      <!-- Breadcrumb -->
      <Breadcrumbs :items="breadcrumbItems" />
       <!-- Adsterra Banner -->
          <AdsterraBanner class="movie-page__adsterra" />

          <!-- AdSense Banner -->
          <AdSenseAd format="auto" layout="in-feed" responsive class="movie-page__ad" />
      <!-- Header with Poster and Backdrop -->
      <header class="movie-page__header">
        <div class="movie-page__media">
          <div class="movie-page__poster">
            <img v-if="posterUrl" :src="posterUrl" :alt="movie.title" class="movie-page__poster-img" loading="lazy" />
            <div v-else class="movie-page__poster-placeholder">
              <span>🎬</span>
              <p>{{ t('movie.no_poster') }}</p>
            </div>
          </div>

        </div>

        <div class="movie-page__info">

          <h1 class="movie-page__title">{{ movie.title }}</h1>

          <p v-if="movie.original_title && movie.original_title !== movie.title" class="movie-page__original-title">
            <span class="label">{{ t('movie.original_title') }}:</span> {{ movie.original_title }}
          </p>

          <p v-if="movie.tagline" class="movie-page__tagline">"{{ movie.tagline }}"</p>

          <div class="movie-page__meta">
            <span class="movie-page__year" v-if="releaseYear">
              {{ releaseYear }}
            </span>
            <span class="movie-page__duration" v-if="movie.runtime_minutes">
              {{ formatDuration(movie.runtime_minutes) }}
            </span>
            <span class="movie-page__status" v-if="movie.status">
              {{ movie.status }}
            </span>
            <span class="movie-page__popularity" v-if="movie.popularity">
              {{ t('movie.popularity') }}: {{ movie.popularity.toFixed(0) }}
            </span>
          </div>

          <!-- Ratings -->
          <div class="movie-page__ratings" v-if="movie">
            <div class="movie-page__rating-circle" :style="{
              background: animatedRatingPercentage !== null
                ? `conic-gradient(
                    from -90deg,
                    #3E8BFF 0%,
                    #3E8BFF ${animatedRatingPercentage}%,
                    #1A1F55 ${animatedRatingPercentage}%,
                    #1A1F55 100%
                  )`
                : '#1A1F55',
              boxShadow: animatedRatingPercentage !== null ? '0 0 12px rgba(62, 139, 255, 0.12)' : 'none'
            }">
              <div class="movie-page__rating-circle__inner">
                <span class="movie-page__rating-circle__rating-value">{{ animatedRatingPercentage !== null ?
                  `${animatedRatingPercentage}%` : 'N/A' }}</span>
              </div>
            </div>
            <div class="movie-page__ratings__count" v-if="movie.vote_count">
              {{ movie.vote_count.toLocaleString() }} {{ t('movie.votes') }}
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="movie-page__action-buttons" v-if="movie">
            <button type="button" @click="toggleAction('watchlist')" :aria-pressed="activeActions.watchlist"
              :class="['movie-page__action-btn', { 'movie-page__action-btn--active': activeActions.watchlist }]">
              <img :src="`/assets/icons/discover.svg`" alt="" class="action-icon" aria-hidden="true" />
              <span class="action-label">{{ t('movie.watchlist') }}</span>
            </button>
            <button type="button" @click="toggleAction('favorite')" :aria-pressed="activeActions.favorite"
              :class="['movie-page__action-btn', { 'movie-page__action-btn--active': activeActions.favorite }]">
              <img :src="`/assets/icons/rating.svg`" alt="" class="action-icon" aria-hidden="true" />
              <span class="action-label">{{ t('movie.favorite') }}</span>
            </button>
            <button type="button" @click="toggleAction('interest')" :aria-pressed="activeActions.interest"
              :class="['movie-page__action-btn', { 'movie-page__action-btn--active': activeActions.interest }]">
              <img :src="`/assets/icons/track.svg`" alt="" class="action-icon" aria-hidden="true" />
              <span class="action-label">{{ t('movie.interest') }}</span>
            </button>
          </div>

          <!-- Genres as Chips -->
          <div class="movie-page__genres" v-if="movie.genres && movie.genres.length">
            <Chip v-for="genre in movie.genres" :key="genre.id" :label="genre.name" />
          </div>
          <!-- Action Buttons (aligned in block) -->
          <div class="movie-page__actions">
            <a v-if="movie.homepage" :href="movie.homepage" target="_blank" rel="noopener noreferrer"
              class="movie-page__btn movie-page__btn--homepage">
              🌐 {{ t('movie.official_site') }}
              <span class="external-link-icon">↗</span>
            </a>
            <button type="button" @click="showWatchModal = true" class="movie-page__btn movie-page__btn--watch">
              📺 {{ t('movie.watch_now') }}
            </button>
          </div>

         

          <!-- Synopsis -->
          <section class="movie-page__synopsis">
            <h2 class="synopsis__title">{{ t('movie.synopsis') }}</h2>
            <p v-if="movie.overview" class="synopsis__content">{{ movie.overview }}</p>
            <p v-else class="synopsis__empty">{{ t('movie.no_synopsis') }}</p>
          </section>

          <!--Financial Info 
          <section class="movie-page__financial" v-if="movie.budget || movie.revenue">
            <h2 class="financial__title">{{ t('movie.financial') }}</h2>
            <div class="financial__grid">
              <div v-if="movie.budget" class="financial__item">
                <span class="financial__label">{{ t('movie.budget') }}</span>
                <span class="financial__value">{{ formatMoney(movie.budget) }}</span>
              </div>
              <div v-if="movie.revenue" class="financial__item">
                <span class="financial__label">{{ t('movie.revenue') }}</span>
                <span class="financial__value">{{ formatMoney(movie.revenue) }}</span>
              </div>
            </div>
          </section> -->

        </div>
      </header>
    </div>
  </article>

  <div v-else-if="isLoading" class="container movie-page__loading">
    <div class="movie-page__skeleton">
      <div class="movie-page__skeleton-poster"></div>
      <div class="movie-page__skeleton-info">
        <div class="movie-page__skeleton-title"></div>
        <div class="movie-page__skeleton-meta"></div>
        <div class="movie-page__skeleton-overview"></div>
      </div>
    </div>
  </div>

  <div v-else-if="error" class="container movie-page__error">
    <p>{{ error === 404 ? t('movie.not_found') : t('common.error') }}</p>
  </div>

  <!-- Watch Dialog: platform choice + streaming providers -->
  <div v-if="showWatchModal" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="watch-modal-title"
    @click="showWatchModal = false" @keydown.esc="showWatchModal = false">
    <div class="modal modal--watch" @click.stop>
      <div class="modal__header">
        <div>
          <h2 id="watch-modal-title">{{ t('movie.watch_dialog.title') }}</h2>
          <p class="modal__subtitle">{{ t('movie.watch_dialog.subtitle') }}</p>
        </div>
        <button class="modal__close" :aria-label="t('movie.watch_dialog.close')" @click="showWatchModal = false">
          ×
        </button>
      </div>

      <div class="modal__content">
        <!-- Platform choice -->
        <div class="watch-platforms">
          <a v-if="downloadWeb" :href="downloadWeb" target="_blank" rel="noopener noreferrer"
            class="watch-platform watch-platform--web">
            <span class="watch-platform__icon" aria-hidden="true">🌐</span>
            <span class="watch-platform__body">
              <span class="watch-platform__title">{{ t('movie.watch_dialog.web_app') }}</span>
              <span class="watch-platform__desc">{{ t('movie.watch_dialog.web_app_desc') }}</span>
            </span>
          </a>

          <a v-if="downloadAndroid" :href="downloadAndroid" target="_blank" rel="noopener noreferrer"
            class="watch-platform watch-platform--android">
            <span class="watch-platform__icon" aria-hidden="true">▶</span>
            <span class="watch-platform__body">
              <span class="watch-platform__title">{{ t('movie.watch_dialog.android_app') }}</span>
              <span class="watch-platform__desc">{{ t('movie.watch_dialog.android_app_desc') }}</span>
            </span>
          </a>
        </div>

        <!-- Streaming providers (collapsible) -->
        <div class="watch-streams">
          <button type="button" class="watch-streams__toggle" :aria-expanded="showStreams"
            @click="showStreams = !showStreams">
            <span>{{ t('watch.stream_label') }}</span>
            <span class="watch-streams__chevron" aria-hidden="true">{{ showStreams ? '▲' : '▼' }}</span>
          </button>

          <div v-show="showStreams">
            <div v-if="isLoadingProviders" class="providers__loading">
              <p>{{ t('common.loading') }}...</p>
            </div>

            <div v-else-if="!hasProviders" class="providers__empty">
              <p>{{ t('movie.no_providers') }}</p>
            </div>

            <div v-else class="providers">
              <section v-for="section in providerSections" :key="section.key" class="providers__category">
                <h3>{{ t(section.label) }}</h3>
                <div class="providers__grid">
                  <div v-for="provider in section.providers" :key="provider.id" class="provider__card">
                    <img v-if="provider.logo_path" :src="getProviderImageUrl(provider.logo_path)" :alt="provider.name"
                      class="provider__logo" />
                    <span class="provider__name">{{ provider.name }}</span>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>


</template>

<script setup lang="ts">
import { ref, computed, onMounted, watchEffect, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { generateMovieSchema } from '@/lib/seo'
import { useSeo } from '@/composables/useSeo'
import { useWatchProviders } from '@/composables/useWatchProviders'
import { useSupabaseAppAuth } from '@/composables/useSupabaseAppAuth'
import Breadcrumbs from '@/components/Breadcrumbs.vue'
import Chip from '@/components/Chip.vue'
import AdSenseAd from '@/components/ads/AdSenseAd.vue'
import AdsterraBanner from '@/components/ads/AdsterraBanner.vue'
import { getMovieByUuid, getTmdbImageUrl, type MovieDetail } from '@/services/movie.service'
import { loadDownloadConfig } from '@/services/downloads'

const { t } = useI18n()
const route = useRoute()

// Watch dialog state: platform choice first, streaming providers below (collapsible)
const showStreams = ref(true)
const downloadWeb = ref('')
const downloadAndroid = ref('')
loadDownloadConfig().then((cfg) => {
  downloadWeb.value = cfg.web || ''
  downloadAndroid.value = cfg.android || ''
})

// Composable para watch providers
const {
  providers,
  isLoading: isLoadingProviders,
  hasProviders,
  providerSections,
  loadedMovieId,
  loadProviders,
} = useWatchProviders()

// Route uses :slug param containing backend ID in format: {id}-{title-slugified}
// ID can be UUID (9f5dde6b-...) or TMDB ID (550)
// Extract the ID (first segment before first hyphen)
const movieId = computed(() => {
  const slug = String(route.params.slug || '')

  // Try UUID pattern first (8-4-4-4-12 hex chars)
  const uuidMatch = slug.match(/^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i)
  if (uuidMatch) {
    return uuidMatch[1]
  }

  // Fallback: get first segment before any hyphen (works for both UUID and numeric IDs)
  const parts = slug.split('-')
  return parts[0] || ''
})

const movie = ref<MovieDetail | null>(null)
const isLoading = ref(true)
const showWatchModal = ref(false)
const error = ref<number | string | null>(null)

// providers, isLoadingProviders, loadedMovieId já vêm do composable

const breadcrumbItems = computed(() => [
  { label: t('common.home'), to: '/' },
  { label: 'Movies', to: '/movies' },
  { label: movie.value?.title || movieId.value },
])

const canonicalUrl = computed(() => {
  const baseUrl = import.meta.env.VITE_SITE_URL || 'https://watchnext.app'
  return `${baseUrl}/movies/${movieId.value}`
})

const posterUrl = computed(() => {
  return getTmdbImageUrl(movie.value?.poster_path ?? null, 'w500')
})

const backdropUrl = computed(() => {
  return getTmdbImageUrl(movie.value?.backdrop_path ?? null, 'original')
})

const releaseYear = computed(() => {
  if (!movie.value?.release_date) return ''
  return new Date(movie.value.release_date).getFullYear().toString()
})

const ratingPercentage = computed<number | null>(() => {
  const v = movie.value?.vote_average

  if (typeof v !== 'number' || !Number.isFinite(v)) {
    return null
  }

  return Math.min(100, Math.max(0, Math.round(v * 10)))
})

// hasProviders vem do composable useWatchProviders

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}h ${mins}m`
}

function formatMoney(amount: number | null): string {
  if (!amount) return ''
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}

function getProviderImageUrl(logoPath: string | null): string | undefined {
  return getTmdbImageUrl(logoPath, 'w92')
}

// Load movie data and watch providers in parallel
onMounted(async () => {
  try {
    isLoading.value = true
    error.value = null
    const id = movieId.value
    if (!id) {
      throw new Error('Invalid movie ID')
    }

    // Load movie details and watch providers in parallel
    await Promise.all([
      (async () => {
        movie.value = await getMovieByUuid(id)
      })(),
      (async () => {
        await loadProviders(id)
      })(),
    ])


  } catch (err: any) {
    error.value = err?.response?.status === 404 ? 404 : 'unknown'
    movie.value = null

  } finally {
    isLoading.value = false
  }
})

// Rating animation state
const ratingAnimated = ref(false)
const animatedRatingPercentage = ref<number | null>(null)

// Check if reduced motion is preferred
const prefersReducedMotion = ref(false)
onMounted(() => {
  if (window.matchMedia) {
    prefersReducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }
})

// Watch for movie data changes to trigger rating animation
watch(movie, (newMovie) => {
  if (newMovie && !ratingAnimated.value) {
    // If reduced motion is preferred, show immediately without animation
    if (prefersReducedMotion.value) {
      animatedRatingPercentage.value = ratingPercentage.value
      ratingAnimated.value = true
      return
    }

    // Start animation from 0% to actual rating percentage
    const actualRating = ratingPercentage.value
    if (actualRating !== null) {
      animatedRatingPercentage.value = 0
      ratingAnimated.value = true

      // Animate the percentage value
      const duration = 800 // ms
      const startTime = performance.now()

      function animatePercentage(currentTime: number) {
        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / duration, 1)
        // Use ease-out cubic for smooth animation
        const easedProgress = 1 - Math.pow(1 - progress, 3)
        animatedRatingPercentage.value = Math.round(easedProgress * actualRating!)

        if (progress < 1) {
          requestAnimationFrame(animatePercentage)
        } else {
          // Ensure we end at exact value
          animatedRatingPercentage.value = actualRating
        }
      }

      requestAnimationFrame(animatePercentage)
    } else {
      // For N/A ratings, just show immediately
      animatedRatingPercentage.value = null
      ratingAnimated.value = true
    }
  }
})

// Fallback: carrega providers apenas se necessário (não foi carregado no onMounted)
watchEffect(() => {
  const currentMovieId = movie.value?.id
  // Só carrega se: modal aberto, não carregado para este movie, e não está carregando
  if (showWatchModal.value && currentMovieId && loadedMovieId.value !== currentMovieId && !isLoadingProviders.value) {
    loadProviders(currentMovieId)
  }
})

// Handle login-required actions
const { isAuthenticated, signIn } = useSupabaseAppAuth()

function handleLoginRequired() {
  if (!isAuthenticated.value) {
    // Trigger login using the existing authentication system
    signIn('guest@seeus.com', 'temporary123') // This will show the login modal or redirect
  }
}

// Independent visual toggle state for the three action buttons (UI-only, no persistence)
const activeActions = ref<{ watchlist: boolean; favorite: boolean; interest: boolean }>({
  watchlist: false,
  favorite: false,
  interest: false,
})

function toggleAction(action: 'watchlist' | 'favorite' | 'interest') {
  handleLoginRequired()
  activeActions.value[action] = !activeActions.value[action]
}

// Setup SEO
const seoTitle = computed(() => movie.value ? `${movie.value.title} | SeeUs` : 'Movies | SeeUs')
const seoDescription = computed(() => movie.value?.overview || 'Discover our curated collection of films')
const seoImage = computed(() => getTmdbImageUrl(movie.value?.poster_path ?? null))
const ogType = computed(() => 'video.movie')

// Movie JSON-LD structured data
const movieJsonLd = computed(() => {
  if (!movie.value) return {}
  return generateMovieSchema({
    title: movie.value.title,
    description: movie.value.overview || '',
    cover: getTmdbImageUrl(movie.value.poster_path),
    releaseYear: releaseYear.value,
    duration: movie.value.runtime_minutes || 0,
    rating: movie.value.vote_average?.toString() || '',
    tags: movie.value.genres?.map(g => g.name) || [],
    slug: movieId.value,
  } as any)
})

useSeo({
  title: seoTitle,
  description: seoDescription,
  url: canonicalUrl,
  image: seoImage,
  type: ogType,
  jsonLd: movieJsonLd,
})
</script>

<style lang="scss" scoped>
.movie-page {
  padding: 2rem 0 4rem;

  &__container {
    max-width: 1200px;
    margin: 0 auto;
  }

  &__loading {
    padding: 4rem 0;
    text-align: center;
    color: var(--text-secondary);
  }

  &__header {
    display: grid;
    grid-template-columns: 300px 1fr;
    gap: 2rem;
    margin-bottom: 3rem;

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
      gap: 1.5rem;

      .movie-page__poster {
        max-width: 300px;
        margin: 0 auto;
      }
    }
  }

  &__media {
    position: relative;
  }

  &__backdrop {
    margin-top: 1.5rem;
    border-radius: 8px;
    overflow: hidden;

    &-img {
      width: 100%;
      height: auto;
      display: block;
    }
  }

  &__poster {
    position: relative;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);

    &-img {
      width: 100%;
      aspect-ratio: 2 / 3;
      object-fit: cover;
      display: block;
    }

    &-placeholder {
      width: 100%;
      aspect-ratio: 2 / 3;
      background: var(--bg-secondary);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: var(--text-secondary);
      font-size: 3rem;

      span {
        font-size: 4rem;
        margin-bottom: 0.5rem;
      }

      p {
        font-size: 0.875rem;
        margin: 0;
      }
    }
  }

  &__info {
    display: flex;
    flex-direction: column;
  }

  &__title {
    font-size: clamp(1.9rem, 1.5vw + 1.4rem, 2.5rem);
    font-weight: 700;
    letter-spacing: -0.02em;
    color: var(--text-primary);
    margin: 0;
    line-height: 1.15;
  }

  &__original-title {
    color: var(--text-secondary);
    font-size: 1.125rem;
    margin: 0;

    .label {
      font-weight: 600;
      color: var(--text-tertiary);
    }
  }

  &__tagline {
    font-style: italic;
    color: var(--text-secondary);
    font-size: 1rem;
    margin: 0;
  }

  &__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
    margin: 0.5rem 0 1rem;

    span {
      font-size: 0.875rem;
      color: var(--text-secondary);
      background: transparent;
      padding: 0;
      border-radius: 0;
    }

    span::after {
      content: "•";
      margin: 0 0.5rem;
      color: var(--border);
    }

    span:last-child::after {
      content: "";
      margin: 0;
    }
  }


  &__genres {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    padding: 0.5rem 0;

    .chip {
      padding: 0.25rem 0.5rem;
      font-size: 0.75rem;
      font-weight: 500;
      background: var(--bg-tertiary);
      color: var(--text-primary);
      border: 1px solid var(--border-subtle);

      &:hover {
        background: var(--bg-secondary);
        border-color: var(--border);
      }
    }
  }

  &__synopsis {
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--border);

    &__title {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 1rem 0;
    }

    &__content {
      color: var(--text-secondary);
      line-height: 1.7;
      margin: 0;
    }

    &__empty {
      color: var(--text-tertiary);
      font-style: italic;
    }
  }

  &__financial {
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--border);

    &__title {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 1rem 0;
    }

    &__grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    &__item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    &__label {
      font-size: 0.875rem;
      color: var(--text-tertiary);
    }

    &__value {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--text-primary);
    }
  }

  &__homepage {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: var(--brand-primary);
    color: white;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 600;
    transition: all 0.2s ease;
    margin-top: 1rem;

    &:hover {
      background: var(--brand-primary-hover, var(--brand-primary));
      transform: translateY(-2px);
    }

    .external-link-icon {
      font-size: 1rem;
    }
  }

  &__actions {
    display: flex;
    gap: 1rem;
    margin-top: 2rem;
    flex-wrap: wrap;

    @media (max-width: 640px) {
      flex-direction: column;
    }
  }

  &__btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.875rem 1.5rem;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.9375rem;
    text-decoration: none;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;

    &:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
    }

    &--homepage {
      background: var(--brand-primary);
      color: white;

      &:hover {
        background: var(--brand-primary-hover, var(--brand-primary));
        transform: translateY(-2px);
      }

      .external-link-icon {
        font-size: 1rem;
      }
    }

    &--watch {
      flex: 1;
      min-width: 200px;
      background: var(--brand-accent);
      color: white;

      &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(var(--brand-accent-rgb), 0.4);
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }
  }

  &__loading {
    padding: 4rem 0;
    text-align: center;
    color: var(--text-secondary);
  }

  &__error {
    padding: 4rem 0;
    text-align: center;
    color: var(--text-error, #ef4444);
  }

  &__skeleton {
    display: grid;
    grid-template-columns: 300px 1fr;
    gap: 2rem;

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }

    &-poster {
      width: 100%;
      aspect-ratio: 2 / 3;
      background: linear-gradient(90deg, var(--bg-secondary) 25%, var(--bg-tertiary) 50%, var(--bg-secondary) 75%);
      background-size: 200% 100%;
      border-radius: 8px;
      animation: shimmer 1.5s infinite;
    }

    &-info {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    &-title {
      height: 3rem;
      background: linear-gradient(90deg, var(--bg-secondary) 25%, var(--bg-tertiary) 50%, var(--bg-secondary) 75%);
      background-size: 200% 100%;
      border-radius: 4px;
      animation: shimmer 1.5s infinite;
    }

    &-meta {
      height: 1.5rem;
      background: linear-gradient(90deg, var(--bg-secondary) 25%, var(--bg-tertiary) 50%, var(--bg-secondary) 75%);
      background-size: 200% 100%;
      border-radius: 4px;
      animation: shimmer 1.5s infinite;
    }

    &-overview {
      height: 6rem;
      background: linear-gradient(90deg, var(--bg-secondary) 25%, var(--bg-tertiary) 50%, var(--bg-secondary) 75%);
      background-size: 200% 100%;
      border-radius: 4px;
      animation: shimmer 1.5s infinite;
    }
  }
}

.movie-page__ratings {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0.5rem 0;
  overflow: visible;
}

.movie-page__rating-circle {
  width: 72px;
  height: 72px;
  min-width: 72px;
  min-height: 72px;
  max-width: 72px;
  max-height: 72px;
  flex: 0 0 72px;
  display: grid;
  place-items: center;
  position: relative;
  box-sizing: border-box;
  border-radius: 50%;
  overflow: visible;
}

.movie-page__rating-circle__inner {
  width: 62px;
  height: 62px;
  min-width: 62px;
  min-height: 62px;
  border-radius: 50%;
  background: var(--bg-primary);
  display: grid;
  place-items: center;
  box-sizing: border-box;
}

.movie-page__rating-circle__rating-value {
  display: block;
  margin: 0;
  padding: 0;
  line-height: 1;
  text-align: center;
  white-space: nowrap;
  color: var(--text-primary);
  font-weight: 700;
  font-size: 1rem;
}

.movie-page__ratings__count {
  color: var(--text-secondary);
  font-size: 0.9rem;
  font-weight: 400;
  margin: 0;
  padding: 0;
  white-space: nowrap;
}

/* Action Buttons */
.movie-page__action-buttons {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
  flex-wrap: wrap;
  justify-content: flex-start;
}

.movie-page__action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.movie-page__action-btn .action-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.movie-page__action-btn .action-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  /* Tint icon to SeeUs primary color */
  filter: brightness(0) saturate(100%) invert(22%) sepia(11%) saturate(449%) hue-rotate(190deg) brightness(95%) contrast(102%);
  transition: filter 0.2s ease;
}

.movie-page__action-btn:hover {
  background: var(--bg-tertiary);
  border-color: var(--accent);
}

.movie-page__action-btn:hover .action-icon img {
  /* Lighter icon on hover */
  filter: brightness(0) saturate(100%) invert(22%) sepia(11%) saturate(449%) hue-rotate(190deg) brightness(105%) contrast(102%);
}

.movie-page__action-btn:hover {
  background: var(--bg-tertiary);
  border-color: var(--accent);
  transform: translateY(-1px);
}

.movie-page__action-btn:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.movie-page__action-btn:active {
  transform: translateY(0);
}

.movie-page__action-btn--active {
  background: var(--bg-tertiary);
  border-color: var(--accent);
  color: var(--brand-accent);
  box-shadow: 0 0 0 1px inset var(--accent);
}

.movie-page__action-btn--active .action-icon img {
  filter: brightness(0) saturate(100%) invert(43%) sepia(81%) saturate(2061%) hue-rotate(210deg) brightness(100%) contrast(101%);
}

@media (prefers-reduced-motion: reduce) {
  .movie-page__action-btn {
    transition: none;
  }
}

@media (max-width: 480px) {
  .movie-page__action-buttons {
    gap: 0.75rem;
    margin-top: 1rem;
  }

  .movie-page__action-btn {
    padding: 0.6rem 1.2rem;
    font-size: 0.85rem;
  }
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }

  100% {
    background-position: -200% 0;
  }
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
  backdrop-filter: blur(4px);
}

.modal {
  background: var(--bg-primary);
  border-radius: 12px;
  width: 100%;
  max-width: 800px;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.5rem 2rem;
    border-bottom: 1px solid var(--border);

    h2 {
      margin: 0;
      font-size: 1.5rem;
      color: var(--text-primary);
    }
  }

  &__close {
    background: transparent;
    border: none;
    font-size: 2rem;
    color: var(--text-secondary);
    cursor: pointer;
    line-height: 1;
    padding: 0;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: all 0.2s ease;

    &:hover {
      background: var(--bg-secondary);
      color: var(--text-primary);
    }
  }

  &__content {
    padding: 2rem;
  }
}

.providers {
  display: flex;
  flex-direction: column;
  gap: 2rem;

  &__category {
    h3 {
      margin: 0 0 1rem;
      font-size: 1.1rem;
      color: var(--text-primary);
      font-weight: 600;
    }
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 1rem;
  }

  &__loading,
  &__empty {
    text-align: center;
    padding: 2rem;
    color: var(--text-secondary);
  }
}

.provider {
  &__card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem;
    background: var(--bg-secondary);
    border-radius: 8px;
    transition: all 0.2s ease;

    &:hover {
      background: var(--bg-tertiary);
      transform: translateY(-2px);
    }
  }

  &__logo {
    width: 80px;
    height: 80px;
    object-fit: contain;
  }

  &__name {
    font-size: 0.85rem;
    color: var(--text-primary);
    text-align: center;
    font-weight: 500;
    line-height: 1.3;
  }
}

// Watch dialog: platform-first layout
.modal--watch {
  max-width: 560px;
}

.modal__subtitle {
  margin: 0.25rem 0 0;
  font-size: 0.95rem;
  color: var(--text-secondary);
}

.watch-platforms {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

.watch-platform {
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
  padding: 1rem 1.25rem;
  border-radius: 12px;
  text-decoration: none;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease, border-color 0.2s ease;

  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  &:hover {
    transform: translateY(-2px);
  }

  &__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    font-size: 1.25rem;
    flex-shrink: 0;
    background: var(--bg-tertiary);
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    min-width: 0;
  }

  &__title {
    font-size: 1.0625rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  &__desc {
    font-size: 0.875rem;
    color: var(--text-secondary);
  }

  &--web {
    background: var(--brand-accent);
    box-shadow: 0 6px 18px rgba(var(--brand-accent-rgb), 0.25);

    &:hover {
      box-shadow: 0 8px 22px rgba(var(--brand-accent-rgb), 0.4);
    }

    .watch-platform__title {
      color: #fff;
    }

    .watch-platform__desc {
      color: rgba(255, 255, 255, 0.85);
    }

    .watch-platform__icon {
      background: rgba(255, 255, 255, 0.18);
    }
  }

  &--android {
    background: var(--bg-secondary);
    border: 1px solid var(--border);

    &:hover {
      transform: translateY(-2px);
      border-color: var(--accent);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
    }
  }
}

.watch-streams {
  margin-top: 1.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--border);

  &__toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 0.625rem 0;
    background: transparent;
    border: none;
    cursor: pointer;
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--text-secondary);
    transition: color 0.2s ease;

    &:hover {
      color: var(--text-primary);
    }

    &:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
      border-radius: 4px;
    }
  }

  &__chevron {
    font-size: 0.75rem;
  }
}

// Mobile dialog: near full width, bottom sheet feel
@media (max-width: 640px) {
  .modal-overlay {
    padding: 0.75rem;
    align-items: flex-end;
  }

  .modal {
    max-height: 92vh;
    overflow-y: auto;
    border-radius: 16px 16px 0 0;
  }

  .modal__header {
    padding: 1.25rem 1.25rem 1rem;
  }

  .modal__content {
    padding: 1.25rem;
  }

  .watch-platform {
    padding: 0.875rem 1rem;
  }
}

@media (prefers-reduced-motion: reduce) {

  .watch-platform,
  .watch-streams__toggle,
  .provider__card,
  .movie-page__btn {
    transition: none;
  }
}

/* Genres chips */
.movie-page__genres {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.5rem 0;

  /* We'll rely on the Chip component's existing styles, but we can adjust if needed */
  /* Ensure chips don't grow too large */
  >* {
    /* Override any Chip styles if necessary, but we prefer not to modify Chip globally */
    /* We'll just ensure they are not too big */
    font-size: 0.875rem;
    padding: 0.375rem 0.75rem;
  }
}

/* Synopsis */
.movie-page__synopsis {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border);

  &__title {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-primary);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0 0 1rem 0;

    &::after {
      content: "";
      flex-grow: 1;
      height: 1px;
      background: var(--bg-secondary);
    }
  }

  &__content {
    color: var(--text-secondary);
    line-height: 1.7;
    font-size: 1rem;
    max-width: 60ch;
    /* For readability */
    margin: 0;
  }

  &__empty {
    color: var(--text-tertiary);
    font-style: italic;
    max-width: 60ch;
  }
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .movie-page__genres>* {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
  }

  .movie-page__synopsis {
    &__title {
      font-size: 1.125rem;
    }

    &__content,
    &__empty {
      font-size: 0.875rem;
    }
  }
}
@media (prefers-reduced-motion: reduce) {
  .watch-platform,
  .watch-streams__toggle,
  .provider__card,
  .movie-page__btn {
    transition: none;
  }
}
</style>